import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // 1. Importa useNavigate
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { showToast } from '../utils';

// Carga tu llave pública de Stripe desde las variables de entorno
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// 2. Esta es la función que se comunica con tu backend
async function registerStudio(registrationData: any) {
  // Asegúrate de que esta URL coincida con la de tu endpoint en el backend
  const response = await fetch('https://api.adalusa.art/public/register-studio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registrationData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Lanza un error para que el bloque 'catch' en handleSubmit lo capture
    throw new Error(errorData.message || 'Failed to register the studio.');
  }

  return response.json();
}

// Tu formulario ahora es un componente hijo
const SignUpForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // 3. Inicializa el hook para redirigir
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
    if (!stripe || !elements || !planId || !billingCycle) {
      showToast('An error occurred: Missing plan information.', 'error');
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card details not found.');
      }

      // Crea el PaymentMethod con los datos de facturación
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.directorName,
          email: formData.email,
        },
      });

      if (error) {
        // Si Stripe da un error, lo lanzamos para que lo capture el catch
        throw error;
      }

      // Prepara todos los datos para enviar al backend
      const registrationData = {
        ...formData,
        planId,
        billingCycle,
        paymentMethodId: paymentMethod.id,
      };

      // Llama a la función que se comunica con tu backend
      await registerStudio(registrationData);

      showToast('Registration successful!', 'success');
      navigate('/signup-success'); // Redirige al usuario a la página de éxito

    } catch (apiError: any) {
      // Este bloque captura cualquier error, ya sea de Stripe o de tu API
      const errorMessage = apiError.message || 'Failed to register. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Register Your Studio</h2>
        <form onSubmit={handleSubmit}>
          {/* ... (el resto de tus inputs del formulario se mantiene igual) ... */}
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
            disabled={!stripe || loading}
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