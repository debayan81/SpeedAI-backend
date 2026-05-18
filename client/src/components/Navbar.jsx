import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { assets } from '../assets/assets'
import { useClerk, UserButton, useUser } from '@clerk/react'

const Navbar = () => {
    const navigate = useNavigate();
    const { openSignIn } = useClerk();
    const { isSignedIn } = useUser();

    return (
        <div className='fixed z-50 w-full backdrop-blur-2xl flex justify-between 
    items-center py-3 px-4 sm:px-20 xl:px-32'>
            <img src={assets.logo} alt="logo"
                className='w-32 sm:w-44 cursor-pointer' onClick={() => navigate('/')} />

            {!isSignedIn ? (
                <button
                    onClick={() => openSignIn()}
                    className='flex items-center gap-2 rounded-full text-sm 
                cursor-pointer bg-primary text-white px-8 py-2.5 hover:opacity-90 
                active:scale-95 transition-all duration-200'>
                    get started <ArrowRight className='w-4 h-4' />
                </button>
            ) : (
                <UserButton />
            )}
        </div>
    )
}

export default Navbar