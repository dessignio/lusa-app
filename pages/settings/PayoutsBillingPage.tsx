import React, { useState, useEffect } from 'react';
import { getStripeAccountStatus, createStripeAccountLink } from '../../../apiService';
import { showToast } from '../../../utils';

const PayoutsBillingPage: React.FC = () => {
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        const { status } = await getStripeAccountStatus();
        setAccountStatus(status);
      } catch (err) {
        setError('Failed to fetch Stripe account status.');
        showToast('Failed to fetch Stripe account status.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountStatus();
  }, []);

  const handleConnectClick = async () => {
    try {
      const { url } = await createStripeAccountLink();
      window.location.href = url;
    } catch (err) {
      showToast('Failed to create Stripe connection link.', 'error');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p>Loading account status...</p>;
    }

    if (error) {
      return <p className="text-red-500">{error}</p>;
    }

    switch (accountStatus) {
      case 'unverified':
        return (
          <button onClick={handleConnectClick} className="bg-blue-500 text-white px-6 py-3 rounded-lg">
            Connect with Stripe to Accept Payments
          </button>
        );
      case 'incomplete':
        return (
          <button onClick={handleConnectClick} className="bg-yellow-500 text-white px-6 py-3 rounded-lg">
            Continue Onboarding
          </button>
        );
      case 'active':
        return (
          <div className="text-green-500">
            <p>Your account is connected and active.</p>
            <a href="#" onClick={handleConnectClick} className="text-blue-500 underline">Go to your Stripe Express dashboard</a>
          </div>
        );
      default:
        return <p>Could not determine your account status.</p>;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payouts & Billing</h1>
      {renderContent()}
    </div>
  );
};

export default PayoutsBillingPage;
