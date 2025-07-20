import React, { useState, useEffect, useCallback } from 'react';
import { getStripeAccountStatus, createStripeAccountLink, createStripeConnectAccount } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext'; // 1. Importa tu hook de autenticación

interface AccountStatus {
  status: 'unverified' | 'incomplete' | 'active' | 'error';
  // Añadido por si la API lo devuelve, para ser más explícito
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  url?: string;
}

const PayoutsBillingPage: React.FC = () => {
  // 2. Obtén el usuario del contexto
  const { user } = useAuth(); 
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountStatus = useCallback(async () => {
    if (!user?.studioId) {
      setLoading(false);
      return;
    }

    console.log(`Fetching Stripe account status for studio: ${user.studioId}`);
    try {
      const data = await getStripeAccountStatus(user.studioId);
      console.log('Received data:', data);
      setAccountStatus(data);
    } catch (err: any) {
      console.error('Error fetching status:', err);
      setError(err.message || 'Failed to fetch Stripe account status.');
      showToast(err.message || 'Failed to fetch Stripe account status.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependency array for useCallback

  useEffect(() => {
    fetchAccountStatus();
  }, [fetchAccountStatus]); // Dependency array for useEffect

  const handleConnectClick = async () => {
    try {
      if (accountStatus?.status === 'unverified') {
        // First, create the Stripe Connect account
        await createStripeConnectAccount();
        showToast('Stripe account created. Redirecting to onboarding...', 'info');
        // Re-fetch status to get the new stripeAccountId, then proceed to create link
        await fetchAccountStatus(); // This will update accountStatus state
      }

      // Now, create the account link (for both unverified and incomplete statuses)
      const { url } = await createStripeAccountLink();
      window.location.href = url;
    } catch (err: any) {
      showToast(err.message || 'Failed to create Stripe connection link.', 'error');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p>Loading account status...</p>;
    }

    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    
    if (!accountStatus || accountStatus.status === 'unverified') {
      return (
        <div className="text-center p-4 border rounded-lg">
          <p className="font-semibold text-gray-700">Connect your Stripe Account</p>
          <p className="text-gray-500 text-sm mt-2 mb-4">Connect a Stripe account to start accepting online payments and manage payouts.</p>
          <button onClick={handleConnectClick} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
            Connect with Stripe to Accept Payments
          </button>
        </div>
      );
    }

    if (accountStatus.status === 'incomplete') {
      return (
        <div className="text-center p-4 border border-yellow-400 bg-yellow-50 rounded-lg">
          <p className="font-semibold text-yellow-800">Finish your Stripe setup</p>
          <p className="text-yellow-700 text-sm mt-2 mb-4">Your account is not fully active. Complete your Stripe onboarding to start receiving payouts.</p>
          <button onClick={handleConnectClick} className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">
            Continue Onboarding
          </button>
        </div>
      );
    }

    if (accountStatus.status === 'active') {
      return (
        <div className="text-center p-4 border border-green-400 bg-green-50 rounded-lg">
          <p className="font-semibold text-green-800">Your account is active!</p>
          <p className="text-green-700 text-sm mt-2 mb-4">You can now accept online payments and manage your payouts through Stripe.</p>
          {accountStatus.url && (
            <a href={accountStatus.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Go to your Stripe Express dashboard
            </a>
          )}
        </div>
      );
    }

    return <p className="text-red-500">Could not determine your account status.</p>;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Payouts & Billing</h1>
      <div>{renderContent()}</div>
    </div>
  );
};

export default PayoutsBillingPage;