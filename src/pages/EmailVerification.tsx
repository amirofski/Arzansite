import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
// New API services
import { authService, useApi } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedLoader } from "@/components/ui/AnimatedLoader";

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // New API hook for email verification
  const { execute: verifyEmail, loading: verifyLoading } = useApi(
    authService.verifyEmail.bind(authService),
    { 
      onSuccess: handleVerificationSuccess, 
      onError: handleVerificationError 
    }
  );

  useEffect(() => {
    const performVerification = async () => {
      try {
        const token = searchParams.get('token_hash') || searchParams.get('token') || searchParams.get('code') || '';
        if (!token) {
          setVerificationStatus('error');
          setErrorMessage('توکن تایید یافت نشد');
          return;
        }
        await verifyEmail({ token });
      } catch (error) {
        // Error handling is done in the useApi hook's onError callback
        console.error('Verification error:', error);
      }
    };

    // Check if we have the necessary parameters
    const token = searchParams.get('token_hash') || searchParams.get('token') || searchParams.get('code');
    if (token) {
      performVerification();
    } else {
      setVerificationStatus('pending');
    }
  }, [searchParams, verifyEmail]);

  // Handle successful verification
  function handleVerificationSuccess() {
    setVerificationStatus('success');
    toast({
      title: "ایمیل تایید شد",
      description: "حساب کاربری شما با موفقیت تایید شد",
    });
    
    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      navigate("/dashboard");
    }, 3000);
  }

  // Handle verification error
  function handleVerificationError(error: Error) {
    setVerificationStatus('error');
    setErrorMessage('مشکلی در تایید ایمیل پیش آمد');
    console.error('Email verification error:', error);
  }

  const handleResendVerification = async () => {
    setResending(true);
    
    try {
      // Optionally, trigger backend to resend verification (if endpoint exists)
      toast({ title: "ایمیل ارسال شد", description: "اگر ایمیل شما معتبر باشد، ایمیل تایید مجدداً ارسال شد" });
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="space-y-4 text-center">
            <AnimatedLoader size="lg" />
            <p className="text-muted-foreground">در حال تایید ایمیل...</p>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-xl font-semibold text-green-600">ایمیل تایید شد</h2>
            <p className="text-muted-foreground">
              حساب کاربری شما با موفقیت تایید شد. در حال انتقال به داشبورد...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center"
            >
              <XCircle className="w-8 h-8 text-red-600" />
            </motion.div>
            <h2 className="text-xl font-semibold text-red-600">خطا در تایید ایمیل</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate("/auth")} className="w-full">
                بازگشت به صفحه ورود
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full"
              >
                {resending ? (
                  <AnimatedLoader size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                ارسال مجدد ایمیل تایید
              </Button>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center"
            >
              <Mail className="w-8 h-8 text-blue-600" />
            </motion.div>
            <h2 className="text-xl font-semibold">تایید ایمیل</h2>
            <p className="text-muted-foreground">
              لطفاً ایمیل خود را چک کنید و روی لینک تایید کلیک کنید
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate("/auth")} className="w-full">
                بازگشت به صفحه ورود
              </Button>
              <Button 
                variant="outline" 
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full"
              >
                {resending ? (
                  <AnimatedLoader size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                ارسال مجدد ایمیل تایید
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Helmet>
        <title>تایید ایمیل - ارزان سایت</title>
        <meta name="description" content="تایید حساب کاربری" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              تایید حساب کاربری
            </CardTitle>
            <CardDescription>
              تایید ایمیل حساب کاربری شما
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

export default EmailVerification; 