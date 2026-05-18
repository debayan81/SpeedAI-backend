import React, { useState } from 'react'
import { Sparkles, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const styles = ['realistic', 'anime', 'digital-art']
const styleLabels = { 'realistic': 'Realistic', 'anime': 'Anime Style', 'digital-art': 'Digital Art' }

const GenerateImages = () => {
    const [description, setDescription] = useState('')
    const [style, setStyle] = useState('realistic')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { getToken } = useAuth()
    const { refreshUser } = useAppUser()

    const handleGenerate = async () => {
        if (!description.trim()) return
        setLoading(true)
        setError('')
        setResult('')
        try {
            const token = await getToken()
            const data = await apiCall('/api/ai/image', {
                method: 'POST',
                body: { prompt: description, style }
            }, token)
            setResult(data.imageUrl)
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
                    AI Image Generator
                </h2>

                <div className='mt-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Describe Your Image
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='Describe what you want to see in the image..'
                        rows={5}
                        className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                        outline-none focus:border-primary transition-colors resize-none'
                    />
                </div>

                <div className='mt-5'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Style
                    </label>
                    <div className='flex gap-3'>
                        {styles.map((s) => (
                            <button
                                key={s}
                                onClick={() => setStyle(s)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
                                ${style === s
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {styleLabels[s]}
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
                    style={{ background: 'linear-gradient(135deg, #20C363, #11B97E)' }}
                >
                    <ImageIcon className='w-4 h-4' />
                    {loading ? 'Generating...' : 'Generate image'}
                </button>

                {error && (
                    <p className='mt-3 text-sm text-red-500 text-center'>{error}</p>
                )}
            </div>

            {/* Right panel - Output */}
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <ImageIcon className='w-5 h-5 text-green-500' />
                    Generated image
                </h2>

                <div className='mt-6 flex flex-col items-center justify-center min-h-[300px]'>
                    {result ? (
                        <div className='w-full'>
                            <img
                                src={result}
                                alt='AI Generated'
                                className='w-full rounded-lg shadow-sm'
                            />
                        </div>
                    ) : (
                        <div className='text-center'>
                            <ImageIcon className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                            <p className='text-sm text-gray-400'>
                                Describe an image and click "Generate Image" to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GenerateImages