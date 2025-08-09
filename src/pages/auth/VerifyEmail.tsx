import React, { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState('Verifying...');

  useEffect(() => {
    const token = params.get('token_hash') || params.get('token') || params.get('code');
    const email = params.get('email') || undefined;
    if (!token) {
      setMsg('Missing token');
      return;
    }
    authApi
      .verifyEmail({ token, email })
      .then(() => setMsg('Email verified successfully.'))
      .catch((e) => setMsg(e?.response?.data?.message || 'Verification failed'));
  }, [params]);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Verify Email</h1>
      <p className="mb-4">{msg}</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => nav('/auth/login')}>
        Go to login
      </button>
    </div>
  );
}


