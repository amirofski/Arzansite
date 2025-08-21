import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback: React.FC<{ provider?: string }> = ({ provider }) => {
  const { handleOAuthCallback, getOAuthCallbackParams, error } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const qp = getOAuthCallbackParams();
        
        // Check for OAuth error
        if (qp.error) {
          setStatus('error');
          setMessage(`OAuth error: ${qp.error}`);
          return;
        }

        // Check if we have the required code parameter
        if (!qp.code) {
          setStatus('error');
          setMessage('No authorization code received from OAuth provider');
          return;
        }
        // Determine provider from route or query; fallback to prop or github
        const routeProvider = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('provider') || '' : '')
          || (params.provider as string)
          || provider
          || 'github';

        const result = await handleOAuthCallback(routeProvider, qp.code, qp.state);
        
        setStatus('success');
        setMessage('OAuth login successful! Redirecting...');
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate(result.redirect?.url || '/dashboard');
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
