import React, { useState } from 'react';
import { authApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await authApi.signUp({ email, password, metadata: name ? { name } : undefined });
      setStatus('Check your email to verify your account.');
    } catch (e: any) {
      setStatus(e?.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input className="w-full border px-3 py-2" type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Submitting...' : 'Create account'}</button>
      </form>
      {status && <p className="mt-3 text-sm">{status}</p>}
      <div className="mt-4 text-sm">
        Already have an account? <button onClick={() => nav('/auth/login')} className="text-blue-600 underline">Log in</button>
      </div>
    </div>
  );
}


