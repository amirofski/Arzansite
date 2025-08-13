import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmailVerificationPromptProps {
  userEmail: string;
  onClose: () => void;
  onVerified: () => void;
}

export const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({
  userEmail,
  onClose,
  onVerified,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const { requestVerification } = useAuth();

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requestVerification(userEmail, password);
      setEmailSent(true);
      toast({
        title: 'ایمیل تایید ارسال شد',
        description: 'لطفاً ایمیل خود را بررسی کنید و روی لینک تایید کلیک کنید',
      });
    } catch (error: any) {
      toast({
        title: 'خطا در ارسال ایمیل تایید',
        description: error?.message || 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationCheck = () => {
    // This would typically check if the user has verified their email
    // For now, we'll just close the prompt and let the user continue
    onVerified();
  };

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <CardTitle className="text-xl">ایمیل تایید ارسال شد</CardTitle>
            <CardDescription>
              لطفاً ایمیل خود را بررسی کنید و روی لینک تایید کلیک کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>ایمیل ارسال شده به:</p>
              <p className="font-medium text-foreground">{userEmail}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleVerificationCheck}
                className="flex-1"
                variant="outline"
              >
                تایید را بررسی کنم
              </Button>
              <Button
                onClick={onClose}
                className="flex-1"
              >
                بستن
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4"
          >
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </motion.div>
          <CardTitle className="text-xl">تایید ایمیل مورد نیاز است</CardTitle>
          <CardDescription>
            برای استفاده کامل از خدمات، لطفاً ایمیل خود را تایید کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestVerification} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                رمز عبور خود را وارد کنید
              </label>
              <Input
                id="password"
                type="password"
                placeholder="رمز عبور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                برای ارسال ایمیل تایید، رمز عبور خود را وارد کنید
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                ارسال ایمیل تایید
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                بعداً
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
