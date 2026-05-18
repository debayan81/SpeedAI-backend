import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <footer className='px-4 sm:px-20 xl:px-32 pt-16 pb-6 border-t border-gray-100'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-10 mb-10'>
                {/* Brand */}
                <div>
                    <img src={assets.logo} alt="SpeedAI" className='w-36 mb-4' />
                    <p className='text-sm text-gray-500 leading-relaxed max-w-xs'>
                        Experience the power of AI with SpeedAI.
                        Transform your content creation with our suite of premium AI
                        tools. Write articles, generate images, and enhance your
                        workflow.
                    </p>
                </div>

                {/* Company links */}
                <div>
                    <h4 className='font-semibold text-slate-700 mb-4'>Company</h4>
                    <ul className='space-y-2.5 text-sm text-gray-500'>
                        <li><a href='/' className='hover:text-primary transition-colors'>Home</a></li>
                        <li><a href='#' className='hover:text-primary transition-colors'>About us</a></li>
                        <li><a href='#' className='hover:text-primary transition-colors'>Contact us</a></li>
                        <li><a href='#' className='hover:text-primary transition-colors'>Privacy policy</a></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h4 className='font-semibold text-slate-700 mb-4'>Subscribe to our newsletter</h4>
                    <p className='text-sm text-gray-500 mb-4'>
                        The latest news, articles, and resources, sent to your inbox weekly.
                    </p>
                    <div className='flex gap-2'>
                        <input
                            type='email'
                            placeholder='Enter your email'
                            className='flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                            outline-none focus:border-primary transition-colors'
                        />
                        <button className='bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium
                        hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer'>
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className='border-t border-gray-100 pt-6 text-center'>
                <p className='text-sm text-gray-400'>
                    Copyright 2025 © SpeedAI. All Right Reserved.
                </p>
            </div>
        </footer>
    )
}

export default Footer
