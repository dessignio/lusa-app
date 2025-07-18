import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const plans = [
  {
    name: 'Plan Starter',
    monthlyPrice: 29,
    annualPrice: 240,
    studentLimit: 100,
    description: 'Ideal for growing studios, up to 100 active students.',
    productId: 'prod_ShTPN10hQmh3fD',
  },
  {
    name: 'Plan Studio',
    monthlyPrice: 59,
    annualPrice: 600,
    studentLimit: 500,
    description: 'Ideal for studios with projection, up to 500 active students.',
    productId: 'prod_ShTS5y8iaJcHel',
    recommended: true,
  },
  {
    name: 'Plan Studio Pro',
    monthlyPrice: 100,
    annualPrice: 960,
    studentLimit: 1000,
    description: 'Ideal for studies with a track record, up to 1000 active students.',
    productId: 'prod_ShTVMg7NFV5nML',
  },
];

const PublicPricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800">Attractive Websites</h1>
        <p className="mt-2 text-lg text-gray-600">14-day free trial</p>

        <div className="mt-8">
          <button onClick={() => setBillingCycle('annual')} className={`px-4 py-2 rounded-l-lg ${billingCycle === 'annual' ? 'bg-blue-500 text-white' : 'bg-white'}`}>
            Pay Annually
          </button>
          <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-r-lg ${billingCycle === 'monthly' ? 'bg-blue-500 text-white' : 'bg-white'}`}>
            Pay Monthly
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`border rounded-lg p-6 ${plan.recommended ? 'border-blue-500' : ''}`}>
              {plan.recommended && <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">Recommended</span>}
              <h2 className="text-2xl font-bold mt-4">{plan.name}</h2>
              <p className="text-4xl font-bold mt-4">
                ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice / 12}
                <span className="text-lg">/month</span>
              </p>
              <p className="text-gray-500 mt-2">Up to {plan.studentLimit} students</p>
              <p className="mt-4">{plan.description}</p>
              <NavLink to={`/signup?plan=${plan.productId}&billing=${billingCycle}`}>
                <button className="mt-6 bg-black text-white w-full py-3 rounded-lg">GET STARTED</button>
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicPricingPage;
