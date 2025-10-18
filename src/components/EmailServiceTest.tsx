import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService, adminService, emailManagementService, useApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/utils/errorMessages';

const EmailServiceTest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  // Test password reset email
  const { execute: testPasswordReset, loading: testingPasswordReset } = useApi(
    authService.sendPasswordReset.bind(authService),
    {
      onSuccess: (data) => {
        setTestResults(prev => [...prev, {
          test: 'Password Reset Email',
          success: true,
          data,
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "تست موفق",
          description: "ایمیل ریست پسورد با موفقیت ارسال شد",
        });
      },
      onError: (error) => {
        setTestResults(prev => [...prev, {
          test: 'Password Reset Email',
          success: false,
          error: getErrorMessage(error),
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "تست ناموفق",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  );

  // Test email service directly
  const { execute: testEmailService, loading: testingEmailService } = useApi(
    adminService.testEmailService.bind(adminService),
    {
      onSuccess: (data) => {
        setTestResults(prev => [...prev, {
          test: 'Email Service Test',
          success: true,
          data,
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "تست موفق",
          description: "سرویس ایمیل با موفقیت تست شد",
        });
      },
      onError: (error) => {
        setTestResults(prev => [...prev, {
          test: 'Email Service Test',
          success: false,
          error: getErrorMessage(error),
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "تست ناموفق",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  );

  // Get email service status
  const { execute: getEmailStatus, loading: checkingStatus } = useApi(
    emailManagementService.getEmailServiceStatus.bind(emailManagementService),
    {
      onSuccess: (data) => {
        setTestResults(prev => [...prev, {
          test: 'Email Service Status',
          success: true,
          data,
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "وضعیت سرویس ایمیل",
          description: `وضعیت: ${data.status}`,
        });
      },
      onError: (error) => {
        setTestResults(prev => [...prev, {
          test: 'Email Service Status',
          success: false,
          error: getErrorMessage(error),
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "خطا در دریافت وضعیت",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  );

  // Get email logs
  const { execute: getEmailLogs, loading: checkingLogs } = useApi(
    emailManagementService.getEmailLogs.bind(emailManagementService),
    {
      onSuccess: (data) => {
        setTestResults(prev => [...prev, {
          test: 'Email Logs',
          success: true,
          data: Array.isArray(data) ? data : data.items || data,
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "لاگ‌های ایمیل",
          description: `${Array.isArray(data) ? data.length : (data.items?.length || 0)} لاگ پیدا شد`,
        });
      },
      onError: (error) => {
        setTestResults(prev => [...prev, {
          test: 'Email Logs',
          success: false,
          error: getErrorMessage(error),
          timestamp: new Date().toISOString()
        }]);
        toast({
          title: "خطا در دریافت لاگ‌ها",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  );

  const handleTestPasswordReset = async () => {
    if (!email) {
      toast({
        title: "خطا",
        description: "لطفاً ایمیل را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      await testPasswordReset({ email });
    } catch (error) {
      console.error('Password reset test error:', error);
    }
  };

  const handleTestEmailService = async () => {
    if (!email) {
      toast({
        title: "خطا",
        description: "لطفاً ایمیل را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      await testEmailService({
        to: email,
        subject: 'تست سرویس ایمیل',
        template: 'test',
        data: {
          userName: 'کاربر تست',
          testMessage: 'این یک ایمیل تست است'
        }
      });
    } catch (error) {
      console.error('Email service test error:', error);
    }
  };

  const handleCheckEmailStatus = async () => {
    try {
      await getEmailStatus();
    } catch (error) {
      console.error('Email status check error:', error);
    }
  };

  const handleGetEmailLogs = async () => {
    try {
      await getEmailLogs({ limit: 10 });
    } catch (error) {
      console.error('Email logs fetch error:', error);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4 py-8">
      <Helmet>
        <title>تست سرویس ایمیل - ارزان سایت</title>
        <meta name="description" content="تست و دیباگ سرویس ایمیل" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
                تست سرویس ایمیل
              </CardTitle>
              <CardDescription>
                تست و دیباگ سرویس ایمیل و عملکرد ریست پسورد
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  ایمیل تست
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Test Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleTestPasswordReset}
                  disabled={testingPasswordReset || !email}
                  className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                >
                  {testingPasswordReset ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span className="mr-2">تست ریست پسورد</span>
                </Button>

                <Button
                  onClick={handleTestEmailService}
                  disabled={testingEmailService || !email}
                  className="h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                >
                  {testingEmailService ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  <span className="mr-2">تست سرویس ایمیل</span>
                </Button>

                <Button
                  onClick={handleCheckEmailStatus}
                  disabled={checkingStatus}
                  className="h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
                >
                  {checkingStatus ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  <span className="mr-2">بررسی وضعیت</span>
                </Button>

                <Button
                  onClick={handleGetEmailLogs}
                  disabled={checkingLogs}
                  className="h-12 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold"
                >
                  {checkingLogs ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="mr-2">لاگ‌های ایمیل</span>
                </Button>
              </div>

              {/* Clear Results Button */}
              {testResults.length > 0 && (
                <div className="text-center">
                  <Button
                    onClick={clearResults}
                    variant="outline"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    پاک کردن نتایج
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  نتایج تست‌ها
                </CardTitle>
                <CardDescription>
                  نتایج تست‌های انجام شده
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold">{result.test}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString('fa-IR')}
                      </span>
                    </div>

                    {result.success ? (
                      <div className="text-sm text-green-700">
                        <pre className="whitespace-pre-wrap bg-green-100 p-2 rounded">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <p className="font-medium">خطا:</p>
                        <p>{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EmailServiceTest;
