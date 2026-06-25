import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import AuthInput from '../components/AuthInput.jsx';
import LoadingButton from '../components/LoadingButton.jsx';
import FormError from '../components/FormError.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back! Login successful.', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', err);
      const msg = err.message || 'Invalid email or password.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-200">Sign in to your account</h2>
      </div>

      <FormError message={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email Address"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <AuthInput
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        <LoadingButton type="submit" isLoading={isLoading}>
          Sign In
        </LoadingButton>
      </form>

      <div className="text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition">
          Register here
        </Link>
      </div>
    </div>
  );
}
