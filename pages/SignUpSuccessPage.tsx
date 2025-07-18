import React from 'react';
import { NavLink } from 'react-router-dom';

const SignUpSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-green-500 mb-4">Registration Successful!</h2>
        <p className="text-gray-700 mb-6">Your studio has been created. You can now log in to your admin panel.</p>
        <NavLink to="/login">
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Go to Login
          </button>
        </NavLink>
      </div>
    </div>
  );
};

export default SignUpSuccessPage;
