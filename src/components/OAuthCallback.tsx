import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sessionApiService } from '@/lib/sessionApiService';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface OAuthCallbackProps {
  provider: string;
}

const OAuthCallback: React.FC<OAuthCallbackProps> = ({ provider }) => {
  const { handleOAuthCallback, getOAuthCallbackParams, error } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = getOAuthCallbackParams();
        
        // Check for OAuth error
        if (params.error) {
          setStatus('error');
          setMessage(`OAuth error: ${params.error}`);
          return;
        }

        // Check if we have the required code parameter
        if (!params.code) {
          setStatus('error');
          setMessage('No authorization code received from OAuth provider');
          return;
        }

        // Backend handles callback via server; just verify session
        const me = await sessionApiService.oauthMe();
        if (!me.success) throw new Error(me.error || 'OAuth session not found');
        const result = await handleOAuthCallback(provider, params.code, params.state);
        
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
  }, [provider, handleOAuthCallback, getOAuthCallbackParams, navigate]);

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
