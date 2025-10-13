import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
// Switched to custom backend auth
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OAuthButton from "@/components/ui/OAuthButton";
import { AnimatedLoader } from "@/components/ui/AnimatedLoader";
import { account } from "@/lib/appwrite";
import { authService } from "@/lib/services";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getErrorMessage } from "@/lib/utils/errorMessages";

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState<"idle" | "code_sent" | "verifying">("idle");
  const [otpUserId, setOtpUserId] = useState<string>("");
  const [otpCode, setOtpCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, loading: authLoading, signIn, signUp } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (userRole?.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const response = await signIn(email, password);
      if (response && response.user) {
        toast({ title: "ورود موفق", description: "به حساب کاربری خود خوش آمدید" });
        if (response.redirect?.url) {
          setTimeout(() => navigate(response.redirect!.url), 800);
        } else {
          setTimeout(() => navigate("/dashboard"), 800);
        }
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      toast({ 
        title: "ورود ناموفق", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const res = await signUp(email, password);
      toast({
        title: "ثبت‌نام موفق",
        description: res?.message || "لطفاً ایمیل خود را برای تایید بررسی کنید",
      });
      // Switch to signin mode after successful signup
      setTimeout(() => setMode("signin"), 2000);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      toast({ 
        title: "ثبت‌نام ناموفق", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    if (!email) {
      toast({ title: "ایمیل لازم است", description: "ابتدا ایمیل خود را وارد کنید" });
      return;
    }
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth/magic-link/callback`;
      await authService.requestMagicLink({ email, redirectUrl });
      toast({ title: "لینک ارسال شد", description: "لطفاً ایمیل خود را چک کنید" });
    } catch (e) {
      const errorMessage = getErrorMessage(e);
      toast({ title: "ارسال ناموفق", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startEmailOtp = async () => {
    if (!email) {
      toast({ title: "ایمیل لازم است", description: "ابتدا ایمیل خود را وارد کنید" });
      return;
    }
    try {
      setLoading(true);
      // Create email OTP via Appwrite
      const token = await account.createEmailToken(
        email,
        undefined as never // SDK type mismatch workaround
      );
      // Some SDKs return { userId }, store it for session creation
      const uid = (token as { userId?: string; user_id?: string })?.userId || (token as { userId?: string; user_id?: string })?.user_id || '';
      if (!uid) throw new Error('OTP userId missing');
      setOtpUserId(uid);
      setOtpStep('code_sent');
      toast({ title: "کد ارسال شد", description: "کد تایید به ایمیل شما ارسال شد" });
    } catch (e) {
      const errorMessage = getErrorMessage(e);
      toast({ title: "خطا در ارسال کد", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!otpUserId || otpCode.trim().length === 0) return;
    try {
      setOtpStep('verifying');
      // Complete session using Appwrite Email OTP
      await account.createSession(otpUserId, otpCode);
      const jwt = await account.createJWT();
      await authService.exchangeJwt(jwt.jwt);
      toast({ title: "ورود موفق", description: "با موفقیت وارد شدید" });
      navigate('/dashboard');
    } catch (e) {
      setOtpStep('code_sent');
      const errorMessage = getErrorMessage(e);
      toast({ title: "کد نامعتبر", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <Helmet>
        <title>{"ورود یا ثبت‌نام"} - ارزان سایت</title>
        <meta name="description" content={"ورود یا ثبت‌نام سریع با ایمیل و رمز عبور، لینک جادویی یا کد یکبارمصرف"} />
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
              {mode === "signin" ? "ورود به حساب کاربری" : "ثبت‌نام"}
            </CardTitle>
            <CardDescription>
              {mode === "signin" 
                ? "با ایمیل و رمز عبور خود وارد شوید"
                : "برای ساخت حساب کاربری جدید اطلاعات خود را وارد کنید"
              }
            </CardDescription>

            {/* Mode Toggle */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "outline"}
                onClick={() => setMode("signin")}
                className="flex-1"
              >
                ورود
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "outline"}
                onClick={() => setMode("signup")}
                className="flex-1"
              >
                ثبت‌نام
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
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
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    رمز عبور
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      فراموش کرده‌اید؟
                    </button>
                  )}
                </div>
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white font-semibold text-lg transition-all duration-300"
              >
                {loading ? (
                  <AnimatedLoader size="sm" />
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === "signin" ? "ورود" : "ثبت‌نام"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Switch mode helper text */}
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "signin" ? "حساب کاربری ندارید؟" : "قبلاً ثبت‌نام کرده‌اید؟"}
              </span>
              {" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-primary hover:underline font-medium"
              >
                {mode === "signin" ? "ثبت‌نام کنید" : "وارد شوید"}
              </button>
            </div>

            {/* Alternative authentication methods */}
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

              {/* Magic Link and OTP - Only for signin mode */}
              {mode === "signin" && (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full" onClick={sendMagicLink} disabled={!email || loading}>
                      ورود با لینک
                    </Button>
                    <Button variant="outline" className="w-full" onClick={startEmailOtp} disabled={!email || loading}>
                      ارسال کد یکبارمصرف به ایمیل
                    </Button>
                  </div>
                </div>
              )}

              {otpStep !== 'idle' && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-muted-foreground">کد ۶ رقمی ارسال‌شده به ایمیل را وارد کنید</div>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} dir="ltr">
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <InputOTPSlot key={idx} index={idx} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <div className="flex gap-2">
                    <Button className="w-full" onClick={verifyEmailOtp} disabled={otpStep === 'verifying'}>
                      {otpStep === 'verifying' ? 'در حال بررسی…' : 'تایید کد'}
                    </Button>
                    <Button variant="ghost" onClick={() => setOtpStep('idle')}>انصراف</Button>
                  </div>
                </div>
              )}

              {/* OAuth Buttons - Available for both signin and signup */}
              <div className={`${mode === "signup" ? "mt-4" : "mt-6"} space-y-2`}>
                <OAuthButton 
                  provider="github"
                  onSuccess={() => {
                    toast({ title: "OAuth شروع شد", description: "در حال انتقال به GitHub..." });
                  }}
                  onError={(error) => {
                    toast({ title: "خطا در OAuth", description: error, variant: "destructive" });
                  }}
                >
                  {mode === "signin" ? "ورود با GitHub" : "ثبت‌نام با GitHub"}
                </OAuthButton>
                <OAuthButton 
                  provider="google"
                  onSuccess={() => {
                    toast({ title: "OAuth شروع شد", description: "در حال انتقال به Google..." });
                  }}
                  onError={(error) => {
                    toast({ title: "خطا در OAuth", description: error, variant: "destructive" });
                  }}
                >
                  {mode === "signin" ? "ورود با Google" : "ثبت‌نام با Google"}
                </OAuthButton>
              </div>
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
    </div>
  );
};

export default Auth;