import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createProspect } from '../services/apiService';
import { showToast } from '../utils';
import { ProspectFormData } from '../types';

const PaymentConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Processing your payment...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const paymentIntentClientSecret = query.get('payment_intent_client_secret');
    const paymentIntentId = query.get('payment_intent');

    if (!paymentIntentClientSecret || !paymentIntentId) {
      setMessage('Payment confirmation failed: Missing payment details.');
      setIsError(true);
      showToast('Payment confirmation failed: Missing payment details.', 'error');
      return;
    }

    const processPaymentConfirmation = async () => {
      console.log('Starting payment confirmation process...');
      try {
        // In a real application, you would typically verify the PaymentIntent status on your backend
        // using the paymentIntentId. For this example, we'll assume success if we reach here.
        // However, for a robust solution, a backend webhook or direct API call to Stripe is recommended.

        const storedFormData = sessionStorage.getItem('prospectFormData');
        console.log('Retrieved storedFormData:', storedFormData);
        if (!storedFormData) {
          throw new Error('Prospect data not found in session storage. Cannot complete registration.');
        }

        const prospectFormData: ProspectFormData = JSON.parse(storedFormData);
        console.log('Parsed prospectFormData:', prospectFormData);
        console.log('Payment Intent ID for createProspect:', paymentIntentId);

        // Call your backend to create the prospect with the payment ID
        const createdProspect = await createProspect(prospectFormData, paymentIntentId);
        console.log('createProspect successful. Created prospect:', createdProspect);

        setMessage('Payment successful! Your prospect has been registered.');
        showToast('Prospect registered successfully!', 'success');
        sessionStorage.removeItem('prospectFormData'); // Clean up

        setTimeout(() => {
          navigate('/users/prospects'); // Redirect to prospect list
        }, 3000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during registration.';
        console.error('Error during prospect registration:', error);
        setMessage(`Payment successful, but prospect registration failed: ${errorMessage}`);
        setIsError(true);
        showToast(`Registration failed: ${errorMessage}`, 'error');
        sessionStorage.removeItem('prospectFormData'); // Clean up even on error
        setTimeout(() => {
            navigate('/users/prospects'); // Redirect to prospect list even on error
        }, 5000);
      }
    };

    processPaymentConfirmation();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className={`p-8 rounded-lg shadow-lg text-center ${isError ? 'bg-red-100 text-red-800' : 'bg-white text-gray-700'}`}>
        <h2 className="text-2xl font-bold mb-4">Payment Confirmation</h2>
        <p>{message}</p>
        {!isError && <div className="mt-4 text-sm text-gray-500">Redirecting you shortly...</div>}
      </div>
    </div>
  );
};

export default PaymentConfirmationPage;