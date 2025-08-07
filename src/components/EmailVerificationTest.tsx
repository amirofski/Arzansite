import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ExternalLink } from "lucide-react";

const EmailVerificationTest = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<"signup" | "magiclink">("signup");
  const { toast } = useToast();

  const handleTestEmail = async () => {
    if (!email) {
      toast({
        title: "خطا",
        description: "لطفاً ایمیل را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (testType === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: "test-password-123", // This won't actually create an account
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`,
          },
        });

        if (error) {
          toast({
            title: "خطا در ارسال ایمیل",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "ایمیل ارسال شد",
            description: "ایمیل تایید برای ثبت نام ارسال شد",
          });
        }
      } else if (testType === "magiclink") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify-email`,
          },
        });

        if (error) {
          toast({
            title: "خطا در ارسال ایمیل",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "ایمیل ارسال شد",
            description: "ایمیل magic link ارسال شد",
          });
        }
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در ارسال ایمیل پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testVerificationUrl = () => {
    const testUrl = `${window.location.origin}/auth/verify-email?token=test-token&type=${testType}&redirect_to=${window.location.origin}`;
    window.open(testUrl, "_blank");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          تست تایید ایمیل
        </CardTitle>
        <CardDescription>
          برای تست کردن سیستم تایید ایمیل، ایمیل خود را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">نوع تست</label>
          <div className="flex gap-2">
            <Button
              variant={testType === "signup" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("signup")}
            >
              ثبت نام
            </Button>
            <Button
              variant={testType === "magiclink" ? "default" : "outline"}
              size="sm"
              onClick={() => setTestType("magiclink")}
            >
              Magic Link
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">ایمیل</label>
          <Input
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleTestEmail}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            ارسال ایمیل تست
          </Button>

          <Button
            variant="outline"
            onClick={testVerificationUrl}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4" />
            تست صفحه تایید
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• ایمیل تست برای {testType === "signup" ? "ثبت نام" : "magic link"} ارسال می‌شود</p>
          <p>• دکمه "تست صفحه تایید" صفحه تایید را در تب جدید باز می‌کند</p>
          <p>• این کامپوننت فقط برای تست است و در تولید استفاده نکنید</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailVerificationTest;
