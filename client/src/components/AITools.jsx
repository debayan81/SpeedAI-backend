import React from 'react'
import { AiToolsData } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/react';

const AITools = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    return (
        <div id='ai-tools' className='px-4 sm:px-20 xl:px-32 my-24'>
            <div className='text-center'>
                <h2 className='text-slate-700 text-[42px] font-semibold'>
                    Powerful AI Tools
                </h2>
                <p className='mt-4 text-gray-600 text-sm'>
                    Everything you need to create stunning content with cutting-edge AI technology
                </p>
            </div>
            <div className='flex flex-wrap mt-10 justify-center'>
                {AiToolsData.map((tool, index) => (
                    <div key={index} className='p-8 m-4 max-w-xs rounded-lg bg-[#FDFDFE] shadow-lg
                    border border-gray-100 hover:-translate-y-1 transition-all
                    duration-300 cursor-pointer' onClick={() => user && navigate(tool.path)}>
                        <div className='w-12 h-12 p-3 rounded-xl text-white'
                            style={{ background: `linear-gradient(135deg, ${tool.bg.from}, ${tool.bg.to})` }}
                        >
                            <tool.Icon className='w-6 h-6' />
                        </div>
                        <h3 className='mt-4 text-lg font-semibold text-slate-700'>{tool.title}</h3>
                        <p className='mt-2 text-sm text-gray-500'>{tool.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AITools