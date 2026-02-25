import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';
import { getErrorMessage } from '@/lib/utils/errorMessages';

const MagicLinkCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const userId = searchParams.get('user_id') || searchParams.get('userId');

  const handleVerification = useCallback(async () => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('لینک جادویی نامعتبر است. توکن یافت نشد.');
      return;
    }

    setVerificationStatus('verifying');
    setMessage('در حال تأیید لینک جادویی...');

    try {
      const result = await authService.verifyMagicLink({ token, user_id: userId || undefined });
      
      // Extract and store tokens - checking both nested tokens object and flat structure
      const accessToken = result?.data?.tokens?.accessToken || result?.data?.access_token;
      const refreshToken = result?.data?.tokens?.refreshToken || result?.data?.refresh_token;
      const expiresAt = result?.data?.tokens?.expiresAt || result?.data?.expires_at;

      if (accessToken && refreshToken) {
        tokenManager.setTokens({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt
        });
      }

      setVerificationStatus('success');
      setMessage('ورود موفق! در حال انتقال به داشبورد...');
      
      toast({
        title: 'ورود موفق',
        description: 'با موفقیت وارد شدید',
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Magic link verification error:', error);
      setVerificationStatus('error');
      const errorMessage = getErrorMessage(error);
      setMessage(errorMessage);
      
      toast({
        title: 'خطا در ورود',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [token, userId, navigate, toast]);

  useEffect(() => {
    handleVerification();
  }, [handleVerification]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">در حال تأیید لینک جادویی</h3>
              <p className="text-gray-600 mt-2">{message}</p>
            </div>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ورود موفق!</h3>
              <p className="text-gray-600 mt-2">{message}</p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                رفتن به داشبورد
              </Button>
            </div>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">خطا در تأیید لینک</h3>
                <p className="text-gray-600 mt-2">{message}</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => navigate('/auth')} className="w-full">
                بازگشت به صفحه ورود
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Helmet>
        <title>ورود با لینک جادویی - ارزان سایت</title>
        <meta name="description" content="تأیید لینک جادویی" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">
              لینک جادویی
            </CardTitle>
            <CardDescription>
              لطفاً صبر کنید تا لینک جادویی شما تأیید شود
            </CardDescription>
          </CardHeader>

          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MagicLinkCallback;

