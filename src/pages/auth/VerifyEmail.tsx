import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState('Verifying...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setMsg('Missing verification token');
      return;
    }

    apiClient.verifyEmail(token)
      .then(() => setMsg('Email verified successfully.'))
      .catch(() => setMsg('Verification failed'));
  }, [params]);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Verify Email</h1>
      <p className="mb-4">{msg}</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => nav('/auth')}>
        Go to login
      </button>
    </div>
  );
}


