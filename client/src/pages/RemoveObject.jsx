import React, { useState } from 'react'
import { Sparkles, Scissors } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const RemoveObject = () => {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState('')
    const [description, setDescription] = useState('')
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
        if (!file || !description.trim()) return
        setLoading(true)
        setError('')
        setResult('')
        try {
            const token = await getToken()

            // Step 1: Upload the image to Cloudinary via backend
            const uploadForm = new FormData()
            uploadForm.append('image', file)
            const uploadData = await apiCall('/api/upload', { method: 'POST', formData: uploadForm }, token)

            // Step 2: Remove the object using the Cloudinary URL
            const removeData = await apiCall('/api/ai/remove-object', {
                method: 'POST',
                body: { imageUrl: uploadData.imageUrl, objectToRemove: description }
            }, token)

            setResult(removeData.imageUrl)
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
                    Object Removal
                </h2>

                <div className='mt-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Upload image
                    </label>
                    <div className='border border-gray-200 rounded-lg overflow-hidden'>
                        <input
                            type='file'
                            accept='image/*'
                            onChange={handleFileChange}
                            className='w-full px-4 py-3 text-sm text-gray-500 file:mr-4 file:py-1 file:px-4
                            file:rounded-md file:border file:border-gray-200 file:text-sm file:font-medium
                            file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer'
                        />
                    </div>
                </div>

                {preview && (
                    <div className='mt-4'>
                        <p className='text-xs text-gray-500 mb-2'>Preview:</p>
                        <img src={preview} alt='Preview' className='w-full max-h-48 object-contain rounded-lg border border-gray-100' />
                    </div>
                )}

                <div className='mt-5'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Describe object to remove
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='e.g., car in background, tree from the image'
                        rows={4}
                        className='w-full px-4 py-3 border border-gray-200 rounded-lg text-sm
                        outline-none focus:border-primary transition-colors resize-none'
                    />
                    <p className='text-xs text-gray-400 mt-1'>
                        Be specific about what you want to remove
                    </p>
                </div>

                <button
                    onClick={handleRemove}
                    disabled={loading || !file || !description.trim()}
                    className='w-full mt-6 py-3 rounded-lg text-white font-medium flex items-center 
                    justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] 
                    transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
                    style={{ background: 'linear-gradient(135deg, #5C6AF1, #427DF5)' }}
                >
                    <Scissors className='w-4 h-4' />
                    {loading ? 'Processing...' : 'Remove object'}
                </button>

                {error && (
                    <p className='mt-3 text-sm text-red-500 text-center'>{error}</p>
                )}
            </div>

            {/* Right panel - Output */}
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <Scissors className='w-5 h-5 text-indigo-500' />
                    Processed Image
                </h2>

                <div className='mt-6 flex flex-col items-center justify-center min-h-[300px]'>
                    {result ? (
                        <div className='w-full'>
                            <img src={result} alt='Object removed' className='w-full rounded-lg shadow-sm' />
                            <a href={result} download target='_blank' rel='noreferrer'
                                className='mt-4 inline-block text-sm text-primary hover:underline'>
                                Download image
                            </a>
                        </div>
                    ) : (
                        <div className='text-center'>
                            <Scissors className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                            <p className='text-sm text-gray-400'>
                                Upload an image and describe what to remove
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RemoveObject