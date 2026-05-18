import React from 'react'
import { Check } from 'lucide-react'

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: '',
        subtitle: 'Always free',
        features: ['Title Generation', 'Article Generation'],
        highlighted: false,
    },
    {
        name: 'Premium',
        price: '$16',
        period: '/month',
        subtitle: 'Billed annually',
        features: [
            'Title Generation',
            'Article Generation',
            'Generate Images',
            'Remove Background',
            'Remove Object',
            'Resume Review',
        ],
        highlighted: false,
    },
]

const Pricing = () => {
    return (
        <div className='px-4 sm:px-20 xl:px-32 my-24'>
            <div className='text-center'>
                <h2 className='text-slate-700 text-[42px] font-semibold'>
                    Choose Your Plan
                </h2>
                <p className='mt-3 text-gray-500 text-sm'>
                    Start for free and scale up as you grow. Find the perfect plan for<br />your content creation needs.
                </p>
            </div>
            <div className='flex flex-wrap mt-10 justify-center gap-8'>
                {plans.map((plan, index) => (
                    <div key={index} className='p-8 w-full max-w-xs rounded-xl bg-white shadow-md
                    border border-gray-100 hover:-translate-y-1 transition-all duration-300
                    flex flex-col'>
                        {/* Plan header */}
                        <div className='mb-6'>
                            <h3 className='text-lg font-semibold text-slate-700'>{plan.name}</h3>
                            <div className='flex items-baseline gap-1 mt-2'>
                                <span className='text-4xl font-bold text-slate-800'>{plan.price}</span>
                                {plan.period && <span className='text-gray-400 text-sm'>{plan.period}</span>}
                            </div>
                            {plan.subtitle && (
                                <p className='text-xs text-gray-400 mt-1'>{plan.subtitle === 'Billed annually' ? (
                                    <span className='flex items-center gap-1.5'>
                                        <span className='w-8 h-4 bg-gray-200 rounded-full relative inline-block'>
                                            <span className='w-3 h-3 bg-gray-400 rounded-full absolute top-0.5 left-0.5'></span>
                                        </span>
                                        {plan.subtitle}
                                    </span>
                                ) : plan.subtitle}</p>
                            )}
                        </div>

                        {/* Features */}
                        <div className='flex-1 space-y-3 mb-8'>
                            {plan.features.map((feature, i) => (
                                <div key={i} className='flex items-center gap-2.5'>
                                    <Check className='w-4 h-4 text-primary flex-shrink-0' />
                                    <span className='text-sm text-gray-600'>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Subscribe button */}
                        <button className='w-full py-3 rounded-lg bg-primary text-white font-medium
                        hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer text-sm'>
                            Subscribe
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Pricing
