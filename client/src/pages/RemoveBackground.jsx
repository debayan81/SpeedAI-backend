import React, { useState } from 'react'
import { Sparkles, Eraser } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const RemoveBackground = () => {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState('')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { getToken } = useAuth()
    const { refreshUser } = useAppUser()

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            setFile(selected)
            setPreview(URL.createObjectURL(selected))
            setResult('')
        }
    }

    const handleRemove = async () => {
        if (!file) return
        setLoading(true)
        setError('')
        setResult('')
        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append('image', file)
            const data = await apiCall('/api/ai/remove-bg', { method: 'POST', formData }, token)
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
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <Sparkles className='w-5 h-5 text-primary' />
                    Background Removal
                </h2>
                <div className='mt-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Upload image</label>
                    <div className='border border-gray-200 rounded-lg overflow-hidden'>
                        <input type='file' accept='image/*' onChange={handleFileChange}
                            className='w-full px-4 py-3 text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border file:border-gray-200 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer' />
                    </div>
                    <p className='text-xs text-gray-400 mt-2'>Supports JPG, PNG, and other image formats</p>
                </div>
                {preview && (
                    <div className='mt-4'>
                        <p className='text-xs text-gray-500 mb-2'>Preview:</p>
                        <img src={preview} alt='Preview' className='w-full max-h-48 object-contain rounded-lg border border-gray-100' />
                    </div>
                )}
                <button onClick={handleRemove} disabled={loading || !file}
                    className='w-full mt-6 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
                    style={{ background: 'linear-gradient(135deg, #F76C1C, #F04A3C)' }}>
                    <Eraser className='w-4 h-4' />
                    {loading ? 'Processing...' : 'Remove background'}
                </button>
                {error && <p className='mt-3 text-sm text-red-500 text-center'>{error}</p>}
            </div>
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <Eraser className='w-5 h-5 text-orange-500' />
                    Processed Image
                </h2>
                <div className='mt-6 flex flex-col items-center justify-center min-h-[300px]'>
                    {result ? (
                        <div className='w-full'>
                            <img src={result} alt='Background removed' className='w-full rounded-lg shadow-sm' style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px' }} />
                            <a href={result} download target='_blank' rel='noreferrer' className='mt-4 inline-block text-sm text-primary hover:underline'>Download image</a>
                        </div>
                    ) : (
                        <div className='text-center'>
                            <Eraser className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                            <p className='text-sm text-gray-400'>Upload an image and click "Remove Background" to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RemoveBackground
