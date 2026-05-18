// ============================================================
// SpeedAI — Production Backend Server
// ============================================================

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import postgres from 'postgres';
import { clerkMiddleware, clerkClient, getAuth } from '@clerk/express';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import axios from 'axios';
import { Webhook } from 'svix';

// ============================================================
// 1. App Setup
// ============================================================

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:5173']
        : ['http://localhost:5173'],
    credentials: true,
}));

// IMPORTANT: Clerk webhook route needs raw body, so we register
// express.json() for all routes EXCEPT the webhook endpoint.
// Express 5 does not support path-based middleware exclusion natively,
// so we apply express.json() globally and use express.raw() on the
// webhook route specifically (registered BEFORE express.json via route-level middleware).
app.use((req, res, next) => {
    if (req.path === '/api/webhooks/clerk') {
        return next(); // Skip JSON parsing — the route uses express.raw()
    }
    express.json()(req, res, next);
});

app.use(clerkMiddleware());

// ============================================================
// 2. Cloudinary Config
// ============================================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================================
// 3. Multer Setup (memory storage for file uploads)
// ============================================================

const upload = multer({ storage: multer.memoryStorage() });

// ============================================================
// 4. OpenAI Client (via Gemini-compatible endpoint)
// ============================================================

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

// ============================================================
// 5. Database Connection & Schema
// ============================================================

const sql = postgres(process.env.DATABASE_URL);

async function initDB() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                clerk_id TEXT UNIQUE NOT NULL,
                email TEXT,
                name TEXT,
                credits INTEGER DEFAULT 10,
                plan TEXT DEFAULT 'free',
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS generations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                tool TEXT,
                prompt TEXT,
                output_url TEXT,
                output_text TEXT,
                is_public BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS community_posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title TEXT,
                likes INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS credit_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                amount INTEGER,
                reason TEXT,
                tool TEXT,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `;

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize database tables:', error);
        process.exit(1);
    }
}

// ============================================================
// 6. Middleware: requireAuth
// ============================================================

async function requireAuth(req, res, next) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
        }

        const [dbUser] = await sql`
            SELECT id, clerk_id, email, name, credits, plan, created_at
            FROM users
            WHERE clerk_id = ${userId}
        `;

        if (!dbUser) {
            return res.status(404).json({ error: 'User not found in database.' });
        }

        req.dbUser = dbUser;
        next();
    } catch (error) {
        next(error);
    }
}

// ============================================================
// 7. Helper: checkAndDeductCredit
// ============================================================

async function checkAndDeductCredit(dbUser, tool) {
    if (dbUser.credits <= 0) {
        const err = new Error('Insufficient credits');
        err.status = 403;
        throw err;
    }

    await sql`
        UPDATE users
        SET credits = credits - 1
        WHERE id = ${dbUser.id}
    `;

    await sql`
        INSERT INTO credit_transactions (user_id, amount, reason, tool)
        VALUES (${dbUser.id}, -1, 'used', ${tool})
    `;

    // Update the in-memory object so subsequent reads in the same request are accurate
    dbUser.credits -= 1;
}

// ============================================================
// 8. Routes
// ============================================================

// --- Health Check ---
app.get('/', (req, res) => res.send('server is live!'));

// --- DB Test ---
app.get('/db-test', async (req, res) => {
    try {
        const [result] = await sql`SELECT version()`;
        const version = result?.version || 'No version found';
        res.json({ message: 'Connection successful!', version });
    } catch (error) {
        console.error('Database query failed:', error);
        res.status(500).json({ error: 'Failed to connect to the database.' });
    }
});

// --- Protected route (legacy) ---
app.get('/protected', async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }
    const user = await clerkClient.users.getUser(userId);
    return res.json({ user });
});

// ============================================================
// 8a. Clerk Webhook — POST /api/webhooks/clerk
// ============================================================

app.post(
    '/api/webhooks/clerk',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
        if (!WEBHOOK_SECRET) {
            console.error('Missing CLERK_WEBHOOK_SECRET env variable');
            return res.status(500).json({ error: 'Server misconfigured' });
        }

        const svixId = req.headers['svix-id'];
        const svixTimestamp = req.headers['svix-timestamp'];
        const svixSignature = req.headers['svix-signature'];

        if (!svixId || !svixTimestamp || !svixSignature) {
            return res.status(400).json({ error: 'Missing svix headers' });
        }

        let event;
        try {
            const wh = new Webhook(WEBHOOK_SECRET);
            event = wh.verify(req.body, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            });
        } catch (err) {
            console.error('Webhook verification failed:', err.message);
            return res.status(400).json({ error: 'Webhook verification failed' });
        }

        const { type, data } = event;

        try {
            if (type === 'user.created') {
                const email =
                    data.email_addresses?.[0]?.email_address || null;
                const name =
                    [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

                await sql`
                    INSERT INTO users (clerk_id, email, name)
                    VALUES (${data.id}, ${email}, ${name})
                    ON CONFLICT (clerk_id) DO NOTHING
                `;
                console.log(`✅ User created: ${data.id}`);
            }

            if (type === 'user.deleted') {
                await sql`
                    DELETE FROM users WHERE clerk_id = ${data.id}
                `;
                console.log(`🗑️ User deleted: ${data.id}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Webhook handler error:', error);
            res.status(500).json({ error: 'Webhook handler failed' });
        }
    }
);

// ============================================================
// 8b. User Route — GET /api/user/me
// ============================================================

app.get('/api/user/me', requireAuth, (req, res) => {
    const { id, email, name, credits, plan } = req.dbUser;
    res.json({ id, email, name, credits, plan });
});

// ============================================================
// 8c. AI Tool Routes
// ============================================================

// --- POST /api/ai/article ---
app.post('/api/ai/article', requireAuth, async (req, res, next) => {
    try {
        const { topic, tone } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });

        const validTones = ['professional', 'casual', 'creative'];
        const selectedTone = validTones.includes(tone) ? tone : 'professional';

        await checkAndDeductCredit(req.dbUser, 'article');

        const completion = await openai.chat.completions.create({
            model: 'gemini-2.0-flash',
            messages: [
                { role: 'system', content: 'You are an expert article writer.' },
                {
                    role: 'user',
                    content: `Write a detailed article about: ${topic}. Tone: ${selectedTone}`,
                },
            ],
        });

        const article = completion.choices[0].message.content;

        const [generation] = await sql`
            INSERT INTO generations (user_id, tool, prompt, output_text)
            VALUES (${req.dbUser.id}, 'article', ${topic}, ${article})
            RETURNING id
        `;

        res.json({ generationId: generation.id, article });
    } catch (error) {
        next(error);
    }
});

// --- POST /api/ai/image ---
app.post('/api/ai/image', requireAuth, async (req, res, next) => {
    try {
        const { prompt, style } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const validStyles = ['realistic', 'anime', 'digital-art'];
        const selectedStyle = validStyles.includes(style) ? style : 'realistic';

        await checkAndDeductCredit(req.dbUser, 'image');

        const fullPrompt = `Generate an image: ${prompt}, style: ${selectedStyle}`;

        // Use Gemini's native image generation API (OpenAI compat doesn't support images.generate)
        const geminiResponse = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        // Extract the base64 image from the response
        const parts = geminiResponse.data?.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find(p => p.inlineData);

        if (!imagePart) {
            return res.status(500).json({ error: 'Image generation failed — no image in response' });
        }

        const base64Image = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || 'image/png';

        // Upload the base64 image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'speedai/images' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(Buffer.from(base64Image, 'base64'));
        });

        const imageUrl = uploadResult.secure_url;

        const [generation] = await sql`
            INSERT INTO generations (user_id, tool, prompt, output_url)
            VALUES (${req.dbUser.id}, 'image', ${prompt}, ${imageUrl})
            RETURNING id
        `;

        res.json({ generationId: generation.id, imageUrl });
    } catch (error) {
        next(error);
    }
});

// --- POST /api/ai/resume ---
app.post(
    '/api/ai/resume',
    requireAuth,
    upload.single('resume'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Resume file is required' });
            }

            await checkAndDeductCredit(req.dbUser, 'resume');

            const resumeText = req.file.buffer.toString('utf-8');

            const completion = await openai.chat.completions.create({
                model: 'gemini-2.0-flash',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert career coach and resume reviewer.',
                    },
                    {
                        role: 'user',
                        content: `Review this resume and provide structured feedback with sections: Summary, Strengths, Weaknesses, Improvements.\n\n${resumeText}`,
                    },
                ],
            });

            const review = completion.choices[0].message.content;

            const [generation] = await sql`
                INSERT INTO generations (user_id, tool, prompt, output_text)
                VALUES (${req.dbUser.id}, 'resume', 'Resume review', ${review})
                RETURNING id
            `;

            res.json({ generationId: generation.id, review });
        } catch (error) {
            next(error);
        }
    }
);

// --- POST /api/ai/remove-bg ---
app.post(
    '/api/ai/remove-bg',
    requireAuth,
    upload.single('image'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            await checkAndDeductCredit(req.dbUser, 'remove-bg');

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'speedai/remove-bg',
                        eager: [{ effect: 'background_removal' }],
                        eager_async: false,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });

            // The eager transformation result contains the processed image URL
            const imageUrl =
                uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url;

            const [generation] = await sql`
                INSERT INTO generations (user_id, tool, prompt, output_url)
                VALUES (${req.dbUser.id}, 'remove-bg', 'Background removal', ${imageUrl})
                RETURNING id
            `;

            res.json({ generationId: generation.id, imageUrl });
        } catch (error) {
            next(error);
        }
    }
);

// --- POST /api/ai/remove-object ---
app.post('/api/ai/remove-object', requireAuth, async (req, res, next) => {
    try {
        const { imageUrl, objectToRemove } = req.body;
        if (!imageUrl || !objectToRemove) {
            return res
                .status(400)
                .json({ error: 'imageUrl and objectToRemove are required' });
        }

        await checkAndDeductCredit(req.dbUser, 'remove-object');

        // Extract the public ID from the Cloudinary URL
        // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/speedai/images/abc.jpg
        // public_id = speedai/images/abc
        const urlParts = imageUrl.split('/upload/');
        if (urlParts.length < 2) {
            return res.status(400).json({ error: 'Invalid Cloudinary URL' });
        }
        // Remove version prefix (v1234567890/) and file extension
        const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
        const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');

        // Apply gen_remove transformation
        const transformedUrl = cloudinary.url(publicId, {
            transformation: [
                { effect: `gen_remove:${objectToRemove}` },
            ],
        });

        const [generation] = await sql`
            INSERT INTO generations (user_id, tool, prompt, output_url)
            VALUES (${req.dbUser.id}, 'remove-object', ${objectToRemove}, ${transformedUrl})
            RETURNING id
        `;

        res.json({ generationId: generation.id, imageUrl: transformedUrl });
    } catch (error) {
        next(error);
    }
});

// --- POST /api/ai/summarise ---
app.post('/api/ai/summarise', requireAuth, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        await checkAndDeductCredit(req.dbUser, 'summarise');

        const completion = await openai.chat.completions.create({
            model: 'gemini-2.0-flash',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an expert at summarising content clearly and concisely.',
                },
                {
                    role: 'user',
                    content: `Summarise the following text in 5 bullet points:\n\n${text}`,
                },
            ],
        });

        const summary = completion.choices[0].message.content;

        const [generation] = await sql`
            INSERT INTO generations (user_id, tool, prompt, output_text)
            VALUES (${req.dbUser.id}, 'summarise', ${text.substring(0, 500)}, ${summary})
            RETURNING id
        `;

        res.json({ generationId: generation.id, summary });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// 8d. Upload Route (for remove-object flow)
// ============================================================

// --- POST /api/upload ---
app.post(
    '/api/upload',
    requireAuth,
    upload.single('image'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'speedai/uploads' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });

            res.json({ imageUrl: uploadResult.secure_url });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================
// 8e. History Routes
// ============================================================

// --- GET /api/history ---
app.get('/api/history', requireAuth, async (req, res, next) => {
    try {
        const generations = await sql`
            SELECT id, tool, prompt, output_url, output_text, is_public, created_at
            FROM generations
            WHERE user_id = ${req.dbUser.id}
            ORDER BY created_at DESC
            LIMIT 50
        `;
        res.json({ generations });
    } catch (error) {
        next(error);
    }
});

// --- DELETE /api/history/:id ---
app.delete('/api/history/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM generations
            WHERE id = ${id} AND user_id = ${req.dbUser.id}
            RETURNING id
        `;

        if (result.length === 0) {
            return res
                .status(404)
                .json({ error: 'Generation not found or not owned by you' });
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// 8e. Community Routes
// ============================================================

// --- GET /api/community (public) ---
app.get('/api/community', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const posts = await sql`
            SELECT
                cp.id,
                cp.title,
                cp.likes,
                cp.created_at,
                u.name AS user_name,
                g.output_url,
                g.prompt,
                g.tool
            FROM community_posts cp
            JOIN users u ON cp.user_id = u.id
            JOIN generations g ON cp.generation_id = g.id
            ORDER BY cp.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

        const [{ count }] = await sql`
            SELECT COUNT(*)::int AS count FROM community_posts
        `;

        res.json({ posts, total: count, page });
    } catch (error) {
        next(error);
    }
});

// --- POST /api/community (protected) ---
app.post('/api/community', requireAuth, async (req, res, next) => {
    try {
        const { generationId, title } = req.body;
        if (!generationId || !title) {
            return res
                .status(400)
                .json({ error: 'generationId and title are required' });
        }

        // Verify the generation belongs to the user
        const [generation] = await sql`
            SELECT id FROM generations
            WHERE id = ${generationId} AND user_id = ${req.dbUser.id}
        `;

        if (!generation) {
            return res
                .status(404)
                .json({ error: 'Generation not found or not owned by you' });
        }

        // Insert community post
        const [post] = await sql`
            INSERT INTO community_posts (generation_id, user_id, title)
            VALUES (${generationId}, ${req.dbUser.id}, ${title})
            RETURNING *
        `;

        // Mark the generation as public
        await sql`
            UPDATE generations SET is_public = true WHERE id = ${generationId}
        `;

        res.json(post);
    } catch (error) {
        next(error);
    }
});

// --- DELETE /api/community/:id (protected) ---
app.delete('/api/community/:id', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await sql`
            DELETE FROM community_posts
            WHERE id = ${id} AND user_id = ${req.dbUser.id}
            RETURNING id
        `;

        if (result.length === 0) {
            return res
                .status(404)
                .json({ error: 'Post not found or not owned by you' });
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// 9. Global Error Handler
// ============================================================

app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
});

// ============================================================
// 10. Start Server
// ============================================================

const PORT = process.env.PORT || 4000;

initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
});