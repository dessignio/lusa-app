import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/forms/Input';
import Button from '../components/forms/Button';
import { APP_NAME } from '../constants';
import { UserCircleIcon } from '../components/icons';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
        setError("Both username and password are required.");
        setIsLoading(false);
        return;
    }

    const result = await auth.login({ username, password });

    setIsLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-body-bg px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
             <UserCircleIcon className="w-16 h-16 mx-auto text-brand-primary mb-3" />
            <h1 className="text-2xl font-bold text-brand-text-primary">{APP_NAME}</h1>
            <p className="text-brand-text-secondary">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-brand-error-light text-brand-error-dark text-sm rounded-md text-center">
                {error}
              </div>
            )}
            {/* --- CORRECCIÓN AQUÍ --- */}
            <Input
              id="username"
              label="Email"
              type="email"
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
            {/* ----------------------- */}
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>
          <div className="text-center mt-4">
            <a href="#" className="text-sm text-brand-primary hover:underline">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;