import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
// Switched to custom backend auth
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailVerificationPrompt } from "@/components/EmailVerificationPrompt";
import OAuthButton from "@/components/ui/OAuthButton";
import { AnimatedLoader } from "@/components/ui/AnimatedLoader";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, loading: authLoading, signIn, signUp } = useAuth();

  // Check if user is already logged in and redirect based on role
  useEffect(() => {
    if (!authLoading && user) {
      // Redirect based on role
      if (userRole?.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await authLogin();
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "خطا در ثبت‌نام",
            description: "رمز عبور و تکرار آن یکسان نیستند",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        await authSignup();
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // using signIn/signUp provided by auth hook

  const authLogin = async () => {
    try {
      console.log('Auth: Calling signIn...');
      const response = await signIn(email, password);
      console.log('Auth: Response from signIn:', response);
      
      // Validate minimal response shape (be lenient; rely on ProtectedRoute and subsequent profile fetch)
      if (!response || !response.user) {
        throw new Error('No user information received');
      }
      
      // Handle automatic redirect if provided by backend
      if (response?.redirect) {
        toast({ 
          title: "ورود موفقیت‌آمیز", 
          description: response.redirect.message || "به حساب کاربری خود خوش آمدید" 
        });
        
        // Automatic redirect to dashboard
        setTimeout(() => {
          navigate(response.redirect.url);
        }, 1500); // Small delay to show the success message
      } else {
        toast({ title: "ورود موفقیت‌آمیز", description: "به حساب کاربری خود خوش آمدید" });
      }
    } catch (err: unknown) {
      console.error('Auth: Login error:', err);
      let errorMessage = "مشکلی در ورود پیش آمد. لطفاً دوباره تلاش کنید";
      
      if (err instanceof Error) {
        if (err.message.includes('email verification')) {
          errorMessage = "لطفاً ابتدا ایمیل خود را تایید کنید. ایمیل تایید به صندوق ورودی شما ارسال شده است.";
        } else if (err.message.includes('Profile not found')) {
          errorMessage = "مشکلی در ایجاد پروفایل کاربری پیش آمد. لطفاً دوباره تلاش کنید.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "خطا در ورود",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const authSignup = async () => {
    try {
      const result = await signUp(email, password);
      
      if (result?.verificationEmailSent) {
        // Email sent successfully during signup
        toast({
          title: "ثبت‌نام موفقیت‌آمیز",
          description: result.message || "حساب کاربری شما ساخته شد. لطفاً ایمیل خود را برای تایید بررسی کنید",
        });
        setIsLogin(true);
      } else if (result?.requiresFrontendVerification) {
        // Fallback: email failed, need to login first
        toast({
          title: "ثبت‌نام موفقیت‌آمیز",
          description: result.message || "حساب کاربری شما ساخته شد. لطفاً وارد شوید تا ایمیل تایید ارسال شود",
        });
        setIsLogin(true);
      } else {
        // Default success message
        toast({
          title: "ثبت‌نام موفقیت‌آمیز",
          description: result.message || "حساب کاربری شما ساخته شد",
        });
        setIsLogin(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "مشکلی در ثبت‌نام پیش آمد. لطفاً دوباره تلاش کنید";
      toast({ title: "خطا در ثبت‌نام", description: message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Helmet>
        <title>{isLogin ? "ورود" : "ثبت‌نام"} - ارزان سایت</title>
        <meta name="description" content={isLogin ? "وارد حساب کاربری خود شوید" : "حساب کاربری جدید بسازید"} />
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
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {isLogin ? "ورود به حساب" : "ساخت حساب جدید"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "به حساب کاربری خود وارد شوید" 
                : "برای استفاده از خدمات ارزان سایت ثبت‌نام کنید"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
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

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  رمز عبور
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="رمز عبور خود را وارد کنید"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 pr-10 h-12"
          required
          minLength={8}
        />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      تکرار رمز عبور
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="رمز عبور خود را دوباره وارد کنید"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12"
                        required={!isLogin}
                        minLength={8}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-semibold text-lg transition-all duration-300"
              >
                {loading ? (
                  <AnimatedLoader size="sm" />
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? "ورود" : "ثبت‌نام"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* OAuth Login Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    یا
                  </span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <OAuthButton 
                  provider="github"
                  onSuccess={() => {
                    toast({
                      title: "OAuth شروع شد",
                      description: "در حال انتقال به GitHub...",
                    });
                  }}
                  onError={(error) => {
                    toast({
                      title: "خطا در OAuth",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
                <OAuthButton 
                  provider="google"
                  onSuccess={() => {
                    toast({
                      title: "OAuth شروع شد",
                      description: "در حال انتقال به Google...",
                    });
                  }}
                  onError={(error) => {
                    toast({
                      title: "خطا در OAuth",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            </div>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={switchMode}
                className="text-primary hover:text-primary-hover font-medium transition-colors"
              >
                {isLogin 
                  ? "حساب کاربری ندارید؟ ثبت‌نام کنید" 
                  : "قبلاً ثبت‌نام کرده‌اید؟ وارد شوید"
                }
              </button>
              
              {isLogin && (
                <div>
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    رمز عبور خود را فراموش کرده‌اید؟
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Email Verification Prompt */}
      {showVerificationPrompt && (
        <EmailVerificationPrompt
          userEmail={pendingVerificationEmail}
          onClose={() => setShowVerificationPrompt(false)}
          onVerified={() => {
            setShowVerificationPrompt(false);
            toast({ title: "تایید موفقیت‌آمیز", description: "ایمیل شما تایید شد" });
          }}
        />
      )}
    </div>
  );
};

export default Auth;