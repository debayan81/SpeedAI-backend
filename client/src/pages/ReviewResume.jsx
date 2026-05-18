import React, { useState } from 'react'
import { Sparkles, FileText } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const ReviewResume = () => {
    const [file, setFile] = useState(null)
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { getToken } = useAuth()
    const { refreshUser } = useAppUser()

    const handleReview = async () => {
        if (!file) return
        setLoading(true)
        setError('')
        setResult('')
        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append('resume', file)
            const data = await apiCall('/api/ai/resume', { method: 'POST', formData }, token)
            setResult(data.review)
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
                    Resume Review
                </h2>

                <div className='mt-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Upload Resume
                    </label>
                    <div className='border border-gray-200 rounded-lg overflow-hidden'>
                        <input
                            type='file'
                            accept='.pdf,.txt,.doc,.docx'
                            onChange={(e) => setFile(e.target.files[0])}
                            className='w-full px-4 py-3 text-sm text-gray-500 file:mr-4 file:py-1 file:px-4
                            file:rounded-md file:border file:border-gray-200 file:text-sm file:font-medium
                            file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer'
                        />
                    </div>
                    <p className='text-xs text-gray-400 mt-2'>
                        Supports TXT, PDF, DOC, DOCX formats
                    </p>
                </div>

                {file && (
                    <div className='mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg'>
                        <FileText className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-600 truncate'>{file.name}</span>
                        <span className='text-xs text-gray-400 ml-auto'>
                            {(file.size / 1024).toFixed(1)} KB
                        </span>
                    </div>
                )}

                <button
                    onClick={handleReview}
                    disabled={loading || !file}
                    className='w-full mt-6 py-3 rounded-lg text-white font-medium flex items-center 
                    justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.98] 
                    transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
                    style={{ background: 'linear-gradient(135deg, #12B7AC, #08B6CE)' }}
                >
                    <FileText className='w-4 h-4' />
                    {loading ? 'Reviewing...' : 'Review Resume'}
                </button>

                {error && (
                    <p className='mt-3 text-sm text-red-500 text-center'>{error}</p>
                )}
            </div>

            {/* Right panel - Output */}
            <div className='bg-white rounded-xl border border-gray-100 p-6'>
                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-teal-500' />
                    Analysis Results
                </h2>

                <div className='mt-6 flex flex-col items-center justify-center min-h-[300px]'>
                    {result ? (
                        <div className='prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap'>
                            {result}
                        </div>
                    ) : (
                        <div className='text-center'>
                            <FileText className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                            <p className='text-sm text-gray-400'>
                                Upload your resume and click "Review Resume" to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ReviewResume
