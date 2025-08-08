import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const type = searchParams.get('type');

        if (!token && !email) {
          setVerificationStatus('error');
          setErrorMessage('پارامترهای مورد نیاز برای تایید ایمیل یافت نشد');
          return;
        }

        // If we have a token, verify it with the backend
        if (token) {
          try {
            // Call backend verification endpoint
            await apiClient.verifyEmail(token);
            
            setVerificationStatus('success');
            toast({
              title: "ایمیل تایید شد",
              description: "حساب کاربری شما با موفقیت تایید شد",
            });
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              navigate("/auth");
            }, 3000);
          } catch (error) {
            setVerificationStatus('error');
            setErrorMessage('توکن تایید نامعتبر یا منقضی شده است');
          }
        } else {
          // No token provided, show pending status
          setVerificationStatus('pending');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('مشکلی در تایید ایمیل پیش آمد');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    setResending(true);
    
    try {
      const email = searchParams.get('email');
      if (!email) {
        toast({
          title: "خطا",
          description: "ایمیل برای ارسال مجدد یافت نشد",
          variant: "destructive",
        });
        return;
      }

      // Call backend to resend verification email
      await apiClient.sendEmail({
        to: email,
        subject: 'تایید ایمیل - Arzan Site',
        template: 'verification',
        data: {
          userEmail: email,
          actionUrl: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
          expirationTime: '24 ساعت',
        },
      });

      toast({
        title: "ایمیل ارسال شد",
        description: "ایمیل تایید مجدداً ارسال شد",
      });
    } catch (error) {
      toast({
        title: "خطا در ارسال مجدد",
        description: "مشکلی در ارسال مجدد ایمیل تایید پیش آمد",
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
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
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
              حساب کاربری شما با موفقیت تایید شد. در حال انتقال...
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
                  <Loader2 className="w-4 h-4 animate-spin" />
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
                  <Loader2 className="w-4 h-4 animate-spin" />
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

export default VerifyEmail;
