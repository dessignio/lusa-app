import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StripeReturnPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/settings/payouts-billing');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Stripe Setup Complete!</h1>
        <p>You will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default StripeReturnPage;
