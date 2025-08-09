import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      nav('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 text-sm">
        No account? <button onClick={() => nav('/auth/signup')} className="text-blue-600 underline">Create one</button>
      </div>
    </div>
  );
}


