import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback: React.FC<{ provider?: string }> = ({ provider }) => {
  const { error } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const routeProvider = (search.get('provider') || (params.provider as string) || provider || 'github');

        // New flow: user_id and secret from Appwrite
        const userId = search.get('user_id') || search.get('userId') || search.get('uid') || '';
        const secret = search.get('secret') || search.get('code') || '';

        if (!userId || !secret) {
          setStatus('error');
          setMessage('Missing required OAuth callback parameters');
          return;
        }

        const { authService } = await import('@/lib/services');
        const result = await authService.oauthCallback(routeProvider, { user_id: userId, secret });

        setStatus('success');
        setMessage('OAuth login successful! Redirecting...');
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate((result as any)?.data?.redirect?.url || '/dashboard');
        }, 1500);
        
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'OAuth callback failed');
      }
    };

    processCallback();
  }, [provider, handleOAuthCallback, getOAuthCallbackParams, navigate, params.provider]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            <span className={getStatusColor()}>
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">{message}</p>
          
          {status === 'error' && (
            <Alert className="mb-4">
              <AlertDescription>
                {error || 'An error occurred during OAuth authentication'}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
