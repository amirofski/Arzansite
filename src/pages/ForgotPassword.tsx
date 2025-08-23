import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, Account } from "appwrite";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Appwrite's createRecovery method to initiate password reset
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');
      
      const account = new Account(client);
      
      // Create recovery email with redirect to our reset password page
      const recoveryUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email, recoveryUrl);
      
      setEmailSent(true);
      toast({
        title: "ایمیل ارسال شد",
        description: "ایمیل بازنشانی رمز عبور به آدرس شما ارسال شد",
      });
    } catch (error) {
      console.error('Password recovery error:', error);
      toast({
        title: "خطا در ارسال ایمیل",
        description: "مشکلی در ارسال ایمیل بازنشانی رمز عبور پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Helmet>
        <title>بازنشانی رمز عبور - ارزان سایت</title>
        <meta name="description" content="بازنشانی رمز عبور حساب کاربری" />
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
              {emailSent ? "ایمیل ارسال شد" : "بازنشانی رمز عبور"}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? "ایمیل بازنشانی رمز عبور به آدرس شما ارسال شد"
                : "ایمیل خود را وارد کنید تا لینک بازنشانی رمز عبور ارسال شود"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    ایمیل
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-left"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-semibold text-lg transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "ارسال ایمیل بازنشانی"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  لطفاً صندوق ورودی ایمیل خود را چک کنید و روی لینک بازنشانی رمز عبور کلیک کنید
                </p>
              </div>
            )}

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => navigate("/auth")}
                className="text-primary hover:text-primary-hover font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                بازگشت به صفحه ورود
              </button>
              
              <button
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors block w-full"
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

export default ForgotPassword; 