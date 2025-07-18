import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// 1. Importa 'Elements' y 'loadStripe'
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { showToast } from '../utils';

// 2. Carga tu llave pública de Stripe FUERA de tus componentes
//    Reemplaza 'pk_test_...' con tu llave publicable real
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

// 3. Tu formulario se convierte en un componente hijo para poder usar los hooks de Stripe
const SignUpForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const stripe = useStripe();
  const elements = useElements();

  const [formData, setFormData] = useState({
    directorName: '',
    email: '',
    password: '',
    studioName: '',
  });

  const [loading, setLoading] = useState(false);

  const planId = searchParams.get('plan');
  const billingCycle = searchParams.get('billing');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      showToast(error.message || 'An error occurred.', 'error');
      setLoading(false);
      return;
    }

    // Here you would call your backend endpoint
    // await registerStudio(formData, planId, billingCycle, paymentMethod.id);

    showToast('Registration successful!', 'success');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Register Your Studio</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Director's Name</label>
            <input
              type="text"
              value={formData.directorName}
              onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Studio Name</label>
            <input
              type="text"
              value={formData.studioName}
              onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Payment Details</label>
            <CardElement className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

// El componente que exportas ahora es el "contenedor" que incluye el Provider
const SignUpPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <SignUpForm />
    </Elements>
  );
};

export default SignUpPage;