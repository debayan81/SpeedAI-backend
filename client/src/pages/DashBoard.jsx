import React, { useState, useEffect } from 'react'
import { Sparkles, Clock, Zap, Image, SquarePen, Hash, Eraser, Scissors, FileText } from 'lucide-react'
import { useAuth } from '@clerk/react'
import { apiCall } from '../lib/api'
import { useAppUser } from '../context/UserContext'

const toolIcons = {
    article: SquarePen,
    image: Image,
    'blog-title': Hash,
    'remove-bg': Eraser,
    'remove-object': Scissors,
    resume: FileText,
    summarise: SquarePen,
}

const toolColors = {
    article: 'text-blue-500',
    image: 'text-green-500',
    'blog-title': 'text-purple-500',
    'remove-bg': 'text-orange-500',
    'remove-object': 'text-indigo-500',
    resume: 'text-teal-500',
    summarise: 'text-cyan-500',
}

const DashBoard = () => {
    const { getToken } = useAuth()
    const { user, loading: userLoading } = useAppUser()
    const [generations, setGenerations] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = await getToken()
                const data = await apiCall('/api/history', {}, token)
                setGenerations(data.generations || [])
            } catch (err) {
                console.error('Failed to fetch history:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [getToken])

    const totalCreations = generations.length

    return (
        <div>
            {/* Stats cards */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-4xl'>
                {/* Total Creations */}
                <div className='bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between'>
                    <div>
                        <p className='text-sm text-gray-500'>Total Creations</p>
                        <p className='text-3xl font-bold text-slate-800 mt-1'>
                            {loading ? '–' : totalCreations}
                        </p>
                    </div>
                    <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 
                    flex items-center justify-center'>
                        <Sparkles className='w-6 h-6 text-white' />
                    </div>
                </div>

                {/* Credits Remaining */}
                <div className='bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between'>
                    <div>
                        <p className='text-sm text-gray-500'>Credits Remaining</p>
                        <p className='text-3xl font-bold text-slate-800 mt-1'>
                            {userLoading ? '–' : (user?.credits ?? 0)}
                        </p>
                    </div>
                    <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 
                    flex items-center justify-center'>
                        <Zap className='w-6 h-6 text-white' />
                    </div>
                </div>

                {/* Plan Status */}
                <div className='bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between'>
                    <div>
                        <p className='text-sm text-gray-500'>Plan Status</p>
                        <p className='text-2xl font-bold text-slate-800 mt-1 capitalize'>
                            {userLoading ? '–' : (user?.plan || 'Free')}
                        </p>
                    </div>
                    <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 
                    flex items-center justify-center'>
                        <Sparkles className='w-6 h-6 text-white' />
                    </div>
                </div>
            </div>

            {/* Recent Creations */}
            <div>
                <h2 className='text-xl font-semibold text-slate-800 mb-4'>Recent Creations</h2>

                {loading ? (
                    <div className='space-y-3 max-w-3xl'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='bg-white rounded-xl border border-gray-100 px-6 py-5 animate-pulse'>
                                <div className='h-4 bg-gray-100 rounded w-3/4 mb-2'></div>
                                <div className='h-3 bg-gray-50 rounded w-1/3'></div>
                            </div>
                        ))}
                    </div>
                ) : generations.length === 0 ? (
                    <div className='bg-white rounded-xl border border-gray-100 px-6 py-12 text-center max-w-3xl'>
                        <Clock className='w-12 h-12 text-gray-200 mx-auto mb-3' />
                        <p className='text-sm text-gray-400'>No creations yet. Try one of the AI tools!</p>
                    </div>
                ) : (
                    <div className='space-y-3 max-w-3xl'>
                        {generations.slice(0, 10).map((gen) => {
                            const IconComp = toolIcons[gen.tool] || Sparkles
                            const iconColor = toolColors[gen.tool] || 'text-primary'
                            return (
                                <div key={gen.id} className='bg-white rounded-xl border border-gray-100 
                                px-6 py-4 flex items-center justify-between hover:shadow-sm transition-shadow'>
                                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                                        <IconComp className={`w-4.5 h-4.5 flex-shrink-0 ${iconColor}`} />
                                        <div className='min-w-0'>
                                            <p className='font-medium text-slate-700 text-sm truncate'>
                                                {gen.prompt?.length > 60
                                                    ? gen.prompt.substring(0, 60) + '...'
                                                    : gen.prompt}
                                            </p>
                                            <p className='text-xs text-gray-400 mt-1'>
                                                {gen.tool} — {new Date(gen.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className='text-xs font-medium px-4 py-1.5 rounded-full border border-primary/20 
                                    text-primary bg-primary/5 flex-shrink-0 ml-3'>
                                        {gen.tool}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DashBoard