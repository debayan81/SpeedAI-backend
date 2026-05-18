import React, { useState } from 'react'
import { Sparkles, Hash } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const categories = ['General', 'Technology', 'Business', 'Health', 'Lifestyle', 'Education', 'Travel', 'Food']

const BlogTitles = () => {
    const [keyword, setKeyword] = useState('')
    const [category, setCategory] = useState('General')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { getToken } = useAuth()
    const { refreshUser } = useAppUser()

    const handleGenerate = async () => {
        if (!keyword.trim()) return
        setLoading(true)
        setError('')
        setResult('')
        try {
            const token = await getToken()
            const data = await apiCall('/api/ai/article', {
                method: 'POST',
                body: {
                    topic: `Generate 10 creative and catchy blog title ideas for the keyword "${keyword}" in the category "${category}". Return only the titles as a numbered list.`,
                    tone: 'creative'
                }
            }, token)
            setResult(data.article)
            refreshUser()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left panel - Form */}
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <Sparkles className='w-5 h-5 text-primary' />
                    AI Title Generator
                </h2>

                <div className='mt-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Keyword
                    </label>
                    <input
                        type='text'
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder='The future of artificial intelligence'
                        className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                        outline-none focus:border-primary transition-colors'
                    />
                </div>

                <div className='mt-5'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Category
                    </label>
                    <div className='flex flex-wrap gap-2.5'>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
                                ${category === cat
                                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className='w-full mt-6 py-3 rounded-lg text-white font-medium flex items-center 
                    justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] 
                    transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
                    style={{ background: 'linear-gradient(135deg, #B153EA, #E549A3)' }}
                >
                    <Hash className='w-4 h-4' />
                    {loading ? 'Generating...' : 'Generate title'}
                </button>

                {error && (
                    <p className='mt-3 text-sm text-red-500 text-center'>{error}</p>
                )}
            </div>

            {/* Right panel - Output */}
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <Hash className='w-5 h-5 text-purple-500' />
                    Generated titles
                </h2>

                <div className='mt-6 flex flex-col items-center justify-center min-h-[300px]'>
                    {result ? (
                        <div className='prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap'>
                            {result}
                        </div>
                    ) : (
                        <div className='text-center'>
                            <Hash className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                            <p className='text-sm text-gray-400'>
                                Enter keywords and click "Generate Titles" to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BlogTitles