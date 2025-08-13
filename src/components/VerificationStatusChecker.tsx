import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const VerificationStatusChecker: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    email: string;
    emailVerified: boolean;
    userId: string;
    message: string;
  } | null>(null);
  const { toast } = useToast();
  const { checkEmailVerification } = useAuth();
  const navigate = useNavigate();

  const handleCheckVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: 'خطا',
        description: 'لطفاً ایمیل خود را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const status = await checkEmailVerification(email.trim());
      setVerificationStatus(status);
      
      if (status.emailVerified) {
        toast({
          title: 'ایمیل تایید شده',
          description: 'ایمیل شما قبلاً تایید شده است. می‌توانید وارد شوید',
        });
      } else {
        toast({
          title: 'ایمیل تایید نشده',
          description: status.message || 'ایمیل شما هنوز تایید نشده است',
        });
      }
    } catch (error: any) {
      toast({
        title: 'خطا در بررسی وضعیت',
        description: error?.message || 'مشکلی در بررسی وضعیت تایید پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleRefresh = () => {
    setVerificationStatus(null);
    setEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
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
              بررسی وضعیت تایید ایمیل
            </CardTitle>
            <CardDescription>
              وضعیت تایید ایمیل خود را بررسی کنید
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!verificationStatus ? (
              <form onSubmit={handleCheckVerification} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    ایمیل
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-left"
                    required
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-semibold text-lg transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      بررسی وضعیت
                      <Mail className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      verificationStatus.emailVerified 
                        ? 'bg-green-100' 
                        : 'bg-orange-100'
                    }`}
                  >
                    {verificationStatus.emailVerified ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-orange-600" />
                    )}
                  </motion.div>
                  
                  <h3 className="text-lg font-semibold mb-2">
                    {verificationStatus.emailVerified ? 'ایمیل تایید شده' : 'ایمیل تایید نشده'}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {verificationStatus.message}
                  </p>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>ایمیل: {verificationStatus.email}</p>
                    <p>شناسه کاربر: {verificationStatus.userId}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {verificationStatus.emailVerified ? (
                    <Button onClick={handleLogin} className="flex-1">
                      ورود به حساب
                    </Button>
                  ) : (
                    <Button onClick={handleLogin} className="flex-1" variant="outline">
                      درخواست ایمیل تایید
                    </Button>
                  )}
                  
                  <Button onClick={handleRefresh} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4" />
                    بررسی جدید
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
