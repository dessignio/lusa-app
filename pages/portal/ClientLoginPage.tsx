import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import { UserCircleIcon } from '../../components/icons';

const ClientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useClientAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/portal/dashboard';

  useEffect(() => {
    // Redirect if already logged in
    if (auth.isAuthenticated && !auth.loading) {
        if(auth.students.length > 1 && !auth.selectedStudent) {
            navigate('/portal/select-student', { replace: true });
        } else {
            navigate(from, { replace: true });
        }
    }
  }, [auth.isAuthenticated, auth.loading, auth.students, auth.selectedStudent, navigate, from]);

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

    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    // The useEffect will handle navigation on successful login
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-body-bg px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
             <UserCircleIcon className="w-16 h-16 mx-auto text-brand-primary mb-3" />
            <h1 className="text-2xl font-bold text-brand-text-primary">Client Portal</h1>
            <p className="text-brand-text-secondary">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-brand-error-light text-brand-error-dark text-sm rounded-md text-center">
                {error}
              </div>
            )}
            <Input
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="username"
            />
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
        </div>
      </div>
    </div>
  );
};

export default ClientLoginPage;
