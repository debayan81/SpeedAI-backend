import React from 'react'
import { dummyTestimonialData } from '../assets/assets'
import { assets } from '../assets/assets'

const Testimonials = () => {
    return (
        <div className='px-4 sm:px-20 xl:px-32 my-24'>
            <div className='text-center'>
                <h2 className='text-slate-700 text-[42px] font-semibold'>
                    Loved by Creators
                </h2>
                <p className='mt-3 text-gray-500 text-sm'>
                    Don't just take our word for it. Here's what our<br />users are saying.
                </p>
            </div>
            <div className='flex flex-wrap mt-10 justify-center gap-6'>
                {dummyTestimonialData.map((testimonial, index) => (
                    <div key={index} className='p-6 max-w-xs rounded-xl bg-white shadow-md
                    border border-gray-100 hover:-translate-y-1 transition-all
                    duration-300'>
                        {/* Star rating */}
                        <div className='flex gap-1 mb-4'>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <img key={i}
                                    src={i < testimonial.rating ? assets.star_icon : assets.star_dull_icon}
                                    alt="star"
                                    className='w-4 h-4'
                                />
                            ))}
                        </div>

                        {/* Quote */}
                        <p className='text-gray-600 text-sm leading-relaxed mb-6'>
                            "{testimonial.content}"
                        </p>

                        {/* User info */}
                        <div className='flex items-center gap-3'>
                            <img src={testimonial.image} alt={testimonial.name}
                                className='w-10 h-10 rounded-full object-cover' />
                            <div>
                                <p className='font-semibold text-sm text-slate-700'>{testimonial.name}</p>
                                <p className='text-xs text-gray-400'>{testimonial.title}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Testimonials
