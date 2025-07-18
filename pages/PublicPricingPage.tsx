import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CheckCircleIcon } from '../components/icons'; // Assuming you have a check icon component

const plans = [
  {
    name: 'Plan Starter',
    monthlyPrice: 29,
    annualPrice: 240, // $20/mo
    studentLimit: 100,
    description: 'All the essentials to get your studio up and running smoothly.',
    features: [
        'Up to 100 Students',
        'Online Registration',
        'Class Scheduling',
        'Basic Reporting'
    ],
    productId: 'prod_ShTPN10hQmh3fD',
    annualPriceId: 'price_YOUR_STARTER_ANNUAL_ID', // Replace with your actual annual price ID
    monthlyPriceId: 'price_1Rm4SHRoIWWgoaNuur9yKm0x',
  },
  {
    name: 'Plan Studio',
    monthlyPrice: 59,
    annualPrice: 600, // $50/mo
    studentLimit: 500,
    description: 'Perfect for growing studios that need more power and automation.',
    features: [
        'Up to 500 Students',
        'Everything in Starter',
        'Automated Billing',
        'Parent Portal Access'
    ],
    productId: 'prod_ShTS5y8iaJcHel',
    annualPriceId: 'price_YOUR_STUDIO_ANNUAL_ID', // Replace with your actual annual price ID
    monthlyPriceId: 'price_1Rm4VmRoIWWgoaNuV9bjOALb',
    recommended: true,
  },
  {
    name: 'Plan Studio Pro',
    monthlyPrice: 100,
    annualPrice: 960, // $80/mo
    studentLimit: 1000,
    description: 'Comprehensive tools for large studios to maximize efficiency and revenue.',
    features: [
        'Up to 1000 Students',
        'Everything in Studio',
        'Advanced Financial Reports',
        'Priority Support'
    ],
    productId: 'prod_ShTVMg7NFV5nML',
    annualPriceId: 'price_YOUR_PRO_ANNUAL_ID', // Replace with your actual annual price ID
    monthlyPriceId: 'price_1Rm4YMRoIWWgoaNuQTawGQPl',
  },
];

const PublicPricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const getSavingPercentage = (monthlyPrice: number, annualPrice: number) => {
      const totalMonthly = monthlyPrice * 12;
      const saving = totalMonthly - annualPrice;
      return Math.round((saving / totalMonthly) * 100);
  }

  return (
    <div className="bg-white min-h-screen antialiased">
      {/* Header Section */}
      <div className="py-16 sm:py-24 text-center bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">Jackrabbit Dance Pricing</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600">
            Affordable Pricing for Your Studio. Coppeliapp provides flexible subscription options to fit your studio’s needs. Choose pricing based on student count.
          </p>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mt-10">
        <div className="relative flex items-center p-1 bg-gray-200 rounded-full">
            <button 
                onClick={() => setBillingCycle('monthly')} 
                className={`relative w-1/2 rounded-full py-2 text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                Monthly
            </button>
            <button 
                onClick={() => setBillingCycle('annual')} 
                className={`relative w-1/2 rounded-full py-2 text-sm font-medium transition-colors ${billingCycle === 'annual' ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                Annual
            </button>
            <div className={`absolute top-1 left-1 h-10 w-1/2 bg-white rounded-full shadow-md transform transition-transform ${billingCycle === 'annual' ? 'translate-x-full' : 'translate-x-0'}`}></div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
                key={plan.name} 
                className={`bg-white rounded-2xl shadow-lg p-8 flex flex-col ${plan.recommended ? 'border-2 border-brand-primary' : 'border border-gray-200'}`}>
              
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.recommended && <span className="bg-brand-primary-light/30 text-brand-primary text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</span>}
                </div>
                <p className="mt-4 text-gray-600">{plan.description}</p>
                
                <div className="mt-6">
                    <span className="text-5xl font-extrabold text-gray-900">
                        ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                    </span>
                    <span className="text-lg font-medium text-gray-500">/month</span>
                </div>
                {billingCycle === 'annual' && (
                    <p className="mt-2 text-sm font-medium text-brand-accent-dark">
                        ${plan.annualPrice} billed annually. Save {getSavingPercentage(plan.monthlyPrice, plan.annualPrice)}%!
                    </p>
                )}

                <ul className="mt-8 space-y-4">
                    {plan.features.map(feature => (
                        <li key={feature} className="flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-brand-success-dark mr-3" />
                            <span className="text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
              </div>

              <NavLink 
                to={`/signup?plan=${billingCycle === 'annual' ? plan.annualPriceId : plan.monthlyPriceId}`}
                className="mt-10 block w-full text-center rounded-lg px-6 py-3 text-lg font-semibold text-white transition-transform transform hover:scale-105"
                style={{ backgroundColor: plan.recommended ? '#4F46E5' : '#111827' }} // Using brand.primary for recommended
              >
                Get Started
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicPricingPage;
