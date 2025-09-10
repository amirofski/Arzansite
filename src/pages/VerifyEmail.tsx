import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verifyEmailWithUserId } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendPassword, setResendPassword] = useState('');

  // Accept multiple token param names for compatibility
  const token = searchParams.get('token_hash') || searchParams.get('token') || searchParams.get('code');
  // Backend sends user_id, keep fallback aliases for older links/clients
  const userId = searchParams.get('user_id') || searchParams.get('userId') || searchParams.get('uid');

  const handleVerification = useCallback(async () => {
    if (!token || !userId) return;

    setVerificationStatus('verifying');
    setMessage('Verifying your email...');

    try {
      // Use the auth hook method
      const result = await verifyEmailWithUserId(token, userId);
      setVerificationStatus('success');
      setMessage(result.message || 'Email verified successfully! You can now log in to your account.');
      
      toast({
        title: 'ایمیل تایید شد',
        description: 'ایمیل شما با موفقیت تایید شد. حالا می‌توانید وارد شوید',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed. Please try again or request a new verification email.');
    }
  }, [token, userId, verifyEmailWithUserId, toast, navigate]);

  useEffect(() => {
    if (token && userId) {
      // Call the handler inline to avoid missing-deps lint warning
      (async () => {
        await handleVerification();
      })();
    } else {
      setVerificationStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      // Provide hints in console for debugging
      console.warn('VerifyEmail: Missing parameters', { hasToken: !!token, hasUserId: !!userId, params: Object.fromEntries(searchParams.entries()) });
    }
  }, [token, userId, handleVerification]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const { authService } = await import('@/lib/services');
      if (resendEmail && resendPassword) {
        await authService.requestVerification(resendEmail, resendPassword);
        toast({
          title: 'ایمیل تایید ارسال شد',
          description: 'ایمیل تایید جدید ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید',
        });
      } else if (userId) {
        const response = await authService.requestVerificationByUserId(userId);
        if (response.verificationEmailSent) {
          toast({
            title: 'ایمیل تایید ارسال شد',
            description: response.message || 'ایمیل تایید جدید ارسال شد',
          });
        } else {
          toast({
            title: 'خطا در ارسال ایمیل',
            description: response.message || 'مشکلی در ارسال ایمیل تایید پیش آمد',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'نیاز به اطلاعات',
          description: 'برای ارسال مجدد ایمیل، ایمیل و رمز عبور خود را وارد کنید',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: 'خطا در ارسال ایمیل',
        description: 'مشکلی در ارسال ایمیل تایید پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

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
              <h3 className="text-lg font-semibold text-gray-900">در حال تایید ایمیل</h3>
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
              <h3 className="text-lg font-semibold text-gray-900">ایمیل تایید شد!</h3>
              <p className="text-gray-600 mt-2">{message}</p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                رفتن به صفحه ورود
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
                <h3 className="text-lg font-semibold text-gray-900">خطا در تایید ایمیل</h3>
                <p className="text-gray-600 mt-2">{message}</p>
              </div>
            </div>
            <div className="grid gap-2 text-left">
              <label className="text-sm">ایمیل</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                dir="ltr"
              />
              <label className="text-sm">رمز عبور</label>
              <Input
                type="password"
                placeholder="رمز عبور"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Button onClick={handleResendVerification} className="w-full" disabled={isResending}>
                {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                ارسال مجدد ایمیل تایید
              </Button>
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                بازگشت به صفحه ورود
              </Button>
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Helmet>
        <title>تایید ایمیل - ارزان سایت</title>
        <meta name="description" content="تایید ایمیل حساب کاربری" />
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
              تایید ایمیل
            </CardTitle>
            <CardDescription>
              لطفاً صبر کنید تا ایمیل شما تایید شود
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

export default VerifyEmail;
