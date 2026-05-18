import React, { useState } from 'react'
import { Sparkles, SquarePen } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const WriteArticle = () => {
    const [topic, setTopic] = useState('')
    const [tone, setTone] = useState('professional')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { getToken } = useAuth()
    const { refreshUser } = useAppUser()

    const handleGenerate = async () => {
        if (!topic.trim()) return
        setLoading(true)
        setError('')
        setResult('')
        try {
            const token = await getToken()
            const data = await apiCall('/api/ai/article', {
                method: 'POST',
                body: { topic, tone }
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
                    AI Article Writer
                </h2>

                <div className='mt-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Article Topic
                    </label>
                    <input
                        type='text'
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder='The future of artificial intelligence'
                        className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                        outline-none focus:border-primary transition-colors'
                    />
                </div>

                <div className='mt-5'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Tone
                    </label>
                    <div className='flex gap-3'>
                        {['professional', 'casual', 'creative'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTone(t)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer capitalize
                                ${tone === t
                                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {t}
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
                    style={{ background: 'linear-gradient(135deg, #3588F2, #0BB0D7)' }}
                >
                    <SquarePen className='w-4 h-4' />
                    {loading ? 'Generating...' : 'Generate article'}
                </button>

                {error && (
                    <p className='mt-3 text-sm text-red-500 text-center'>{error}</p>
                )}
            </div>

            {/* Right panel - Output */}
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <SquarePen className='w-5 h-5 text-primary' />
                    Generated article
                </h2>

                <div className='mt-6 flex flex-col items-center justify-center min-h-[300px]'>
                    {result ? (
                        <div className='prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap'>
                            {result}
                        </div>
                    ) : (
                        <div className='text-center'>
                            <SquarePen className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                            <p className='text-sm text-gray-400'>
                                Enter a topic and click "Generate article" to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WriteArticle
