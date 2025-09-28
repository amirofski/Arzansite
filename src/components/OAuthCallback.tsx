import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { AnimatedLoader } from './ui/AnimatedLoader';
import { account } from '@/lib/appwrite';
import { authService } from '@/lib/services';

const OAuthCallback: React.FC<{ provider?: string }> = ({ provider }) => {
  const { error, getCurrentUser } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const process = async () => {
      try {
        const search = new URLSearchParams(window.location.search);
        const errorParam = search.get('error');

        if (errorParam) {
          throw new Error(errorParam);
        }

        // Appwrite handles the session creation in the background after redirect.
        // We just need to get the Appwrite JWT and exchange it with our backend.

        const jwt = await account.createJWT();
        await authService.exchangeJwt(jwt.jwt);

        // Fetch user profile from our backend
        await getCurrentUser();

        // Determine intended next route
        const qNext = search.get('next');
        const storedNext = sessionStorage.getItem('postLoginRedirect') || '';
        const next = qNext || storedNext || '/dashboard';
        const safeNext = typeof next === 'string' && next.startsWith('/') && next !== '/undefined' && next !== '/null' ? next : '/dashboard';

        setStatus('success');
        setMessage('ورود با موفقیت انجام شد. در حال انتقال...');
        navigate(safeNext, { replace: true });
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'OAuth callback failed');
        // Redirect to login page on failure
        setTimeout(() => navigate('/auth?e=oauth_failed', { replace: true }), 3000);
      }
    };

    process();
  }, [navigate, params.provider, provider]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <AnimatedLoader size="md" />;
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            <span className={getStatusColor()}>
              {status === 'loading' && 'در حال پردازش...'}
              {status === 'success' && 'موفقیت آمیز!'}
              {status === 'error' && 'خطا'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
          
          {status === 'error' && (
            <Alert className="mb-4">
              <AlertDescription>
                {error || 'در حین احراز هویت خطایی روی داد'}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              بازگشت به صفحه ورود
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
