import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useClerk, useUser } from '@clerk/react'
import { useAppUser } from '../context/UserContext'
import {
    Home, SquarePen, Hash, Image, Eraser, Scissors, FileText, LogOut, Users, Zap
} from 'lucide-react'

const sidebarLinks = [
    { name: 'Dashboard', path: '/ai', icon: Home, end: true },
    { name: 'Write Article', path: '/ai/write-article', icon: SquarePen },
    { name: 'Blog Titles', path: '/ai/blog-titles', icon: Hash },
    { name: 'Generate Images', path: '/ai/generate-images', icon: Image },
    { name: 'Remove Background', path: '/ai/remove-background', icon: Eraser },
    { name: 'Remove Object', path: '/ai/remove-object', icon: Scissors },
    { name: 'Review Resume', path: '/ai/review-resume', icon: FileText },
    { name: 'Community', path: '/ai/community', icon: Users },
]

const Layout = () => {
    const navigate = useNavigate();
    const { signOut } = useClerk();
    const { user: clerkUser } = useUser();
    const { user: appUser, loading: appLoading } = useAppUser();

    const planLabel = appLoading ? '...' : (appUser?.plan === 'free' ? 'Free Plan' : `${appUser?.plan || 'Free'} Plan`)
    const credits = appLoading ? '–' : (appUser?.credits ?? 0)

    return (
        <div className='flex min-h-screen'>
            {/* Sidebar */}
            <aside className='w-60 flex-shrink-0 flex flex-col bg-white border-r border-gray-100'>
                {/* Logo */}
                <div className='px-5 py-4'>
                    <img src={assets.logo} alt="SpeedAI" className='w-36 cursor-pointer'
                        onClick={() => navigate('/')} />
                </div>

                {/* User profile */}
                <div className='flex flex-col items-center py-5'>
                    <img
                        src={clerkUser?.imageUrl || assets.profile_img_1}
                        alt={clerkUser?.fullName || 'User'}
                        className='w-16 h-16 rounded-full object-cover mb-2'
                    />
                    <p className='font-medium text-sm text-slate-700'>
                        {clerkUser?.fullName || 'User'}
                    </p>
                    {/* Credits badge */}
                    <div className='flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200'>
                        <Zap className='w-3.5 h-3.5 text-amber-500' />
                        <span className='text-xs font-medium text-amber-700'>{credits} credits</span>
                    </div>
                </div>

                {/* Navigation links */}
                <nav className='flex-1 px-3 space-y-1'>
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium 
                                transition-all duration-200 ${isActive
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`
                            }
                        >
                            <link.icon className='w-4.5 h-4.5' />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User footer */}
                <div className='px-5 py-4 border-t border-gray-100'>
                    <div className='flex items-center gap-3'>
                        <img
                            src={clerkUser?.imageUrl || assets.profile_img_1}
                            alt="user"
                            className='w-9 h-9 rounded-full object-cover'
                        />
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-slate-700 truncate'>
                                {clerkUser?.fullName || 'User'}
                            </p>
                            <p className='text-xs text-gray-400 capitalize'>{planLabel}</p>
                        </div>
                        <button
                            onClick={() => signOut(() => navigate('/'))}
                            className='text-gray-400 hover:text-gray-600 transition-colors cursor-pointer'
                        >
                            <LogOut className='w-4 h-4' />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <main className='flex-1 bg-[#F7F8FA] p-6 overflow-y-auto'>
                <Outlet />
            </main>
        </div>
    )
}

export default Layout