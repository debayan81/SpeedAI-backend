import React, { useState, useEffect } from 'react'
import { Heart, Sparkles, Image as ImageIcon, SquarePen, Loader2 } from 'lucide-react'
import { apiCall } from '../lib/api'

const Community = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [likedPosts, setLikedPosts] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        const fetchCommunity = async () => {
            setLoading(true)
            try {
                // Community endpoint is public, no token needed
                const data = await apiCall(`/api/community?page=${page}`)
                setPosts(data.posts || [])
                setTotal(data.total || 0)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchCommunity()
    }, [page])

    const toggleLike = (id) => {
        setLikedPosts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    // Separate image posts from text posts
    const imagePosts = posts.filter(p => p.output_url)
    const textPosts = posts.filter(p => !p.output_url)

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <Loader2 className='w-8 h-8 text-primary animate-spin' />
            </div>
        )
    }

    if (error) {
        return (
            <div className='bg-white rounded-xl border border-gray-100 px-6 py-12 text-center'>
                <p className='text-sm text-red-500'>{error}</p>
            </div>
        )
    }

    return (
        <div>
            <div className='mb-8'>
                <h1 className='text-2xl font-semibold text-slate-800 flex items-center gap-2'>
                    <Sparkles className='w-6 h-6 text-primary' />
                    Community Creations
                </h1>
                <p className='text-sm text-gray-500 mt-1'>
                    Explore what others have created with SpeedAI
                </p>
            </div>

            {posts.length === 0 ? (
                <div className='bg-white rounded-xl border border-gray-100 px-6 py-16 text-center'>
                    <Sparkles className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                    <p className='text-sm text-gray-400'>
                        No community posts yet. Be the first to share your creation!
                    </p>
                </div>
            ) : (
                <>
                    {/* Image Gallery */}
                    {imagePosts.length > 0 && (
                        <>
                            <h2 className='text-lg font-semibold text-slate-700 mb-4'>🎨 AI Generated Images</h2>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10'>
                                {imagePosts.map((post) => (
                                    <div key={post.id} className='bg-white rounded-xl border border-gray-100 
                                    overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group'>
                                        {/* Image */}
                                        <div className='aspect-square overflow-hidden'>
                                            <img
                                                src={post.output_url}
                                                alt={post.prompt || post.title}
                                                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className='p-4'>
                                            <p className='font-medium text-slate-700 text-sm'>
                                                {post.title}
                                            </p>
                                            <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
                                                {post.prompt}
                                            </p>
                                            <div className='flex items-center justify-between mt-3'>
                                                <span className='text-xs text-gray-400'>
                                                    by {post.user_name || 'Anonymous'} · {new Date(post.created_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                                <button
                                                    onClick={() => toggleLike(post.id)}
                                                    className='flex items-center gap-1.5 text-sm cursor-pointer 
                                                    hover:scale-105 active:scale-95 transition-transform'
                                                >
                                                    <Heart
                                                        className={`w-4 h-4 transition-colors ${likedPosts.includes(post.id)
                                                            ? 'fill-red-500 text-red-500'
                                                            : 'text-gray-400'
                                                            }`}
                                                    />
                                                    <span className='text-gray-500 text-xs'>
                                                        {(post.likes || 0) + (likedPosts.includes(post.id) ? 1 : 0)}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Text Creations */}
                    {textPosts.length > 0 && (
                        <>
                            <h2 className='text-lg font-semibold text-slate-700 mb-4'>📝 Articles & Blog Titles</h2>
                            <div className='space-y-3 max-w-4xl'>
                                {textPosts.map((post) => (
                                    <div key={post.id} className='bg-white rounded-xl border border-gray-100 
                                    px-6 py-4 hover:shadow-sm transition-all duration-200'>
                                        <div className='flex items-start justify-between gap-4'>
                                            <div className='flex-1 min-w-0'>
                                                <p className='font-medium text-slate-700 text-sm'>
                                                    {post.title}
                                                </p>
                                                <p className='text-gray-500 text-xs mt-2 line-clamp-2'>
                                                    {post.prompt}
                                                </p>
                                                <p className='text-xs text-gray-400 mt-2'>
                                                    by {post.user_name || 'Anonymous'} · {new Date(post.created_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <span className='text-xs font-medium px-4 py-1.5 rounded-full border 
                                            border-primary/20 text-primary bg-primary/5 flex-shrink-0'>
                                                {post.tool}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {total > 20 && (
                        <div className='flex items-center justify-center gap-3 mt-8'>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className='px-4 py-2 text-sm rounded-lg border border-gray-200 
                                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                            >
                                Previous
                            </button>
                            <span className='text-sm text-gray-500'>Page {page}</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * 20 >= total}
                                className='px-4 py-2 text-sm rounded-lg border border-gray-200 
                                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Community