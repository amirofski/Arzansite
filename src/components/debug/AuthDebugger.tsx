import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';

const AuthDebugger: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const info = {
      isAuthenticated: tokenManager.isAuthenticated(),
      hasAccessToken: !!tokenManager.getAccessToken(),
      hasRefreshToken: !!tokenManager.getRefreshToken(),
      tokenExpiration: tokenManager.getTokenExpiration(),
      localStorage: {
        access_token: localStorage.getItem('access_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        token_expires_at: localStorage.getItem('token_expires_at'),
        backend_access_token: localStorage.getItem('backend_access_token'),
        backend_refresh_token: localStorage.getItem('backend_refresh_token'),
      },
      sessionStorage: {
        user_info: sessionStorage.getItem('user_info'),
      }
    };
    setDebugInfo(info);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'خطا',
        description: 'لطفاً ایمیل و رمز عبور را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.signIn({ email, password });
      console.log('Login response:', response);
      
      if (response.success) {
        toast({
          title: 'ورود موفق',
          description: 'شما با موفقیت وارد شدید',
        });
        updateDebugInfo();
      } else {
        throw new Error(response.message || 'ورود ناموفق');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'خطا در ورود',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearTokens();
    updateDebugInfo();
    toast({
      title: 'خروج',
      description: 'شما از سیستم خارج شدید',
    });
  };

  const handleTestAuth = async () => {
    try {
      const user = await authService.getMe();
      console.log('getMe response:', user);
      toast({
        title: 'تست موفق',
        description: 'احراز هویت موفق بود',
      });
    } catch (error) {
      console.error('getMe error:', error);
      toast({
        title: 'خطا در احراز هویت',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    }
  };

  const handleClearTokens = () => {
    tokenManager.clearTokens();
    updateDebugInfo();
    toast({
      title: 'پاک کردن توکن‌ها',
      description: 'تمام توکن‌ها پاک شدند',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>احراز هویت - دیباگ</CardTitle>
          <CardDescription>
            برای تست و دیباگ سیستم احراز هویت
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'در حال ورود...' : 'ورود'}
              </Button>
              <Button type="button" variant="outline" onClick={handleLogout}>
                خروج
              </Button>
              <Button type="button" variant="outline" onClick={handleTestAuth}>
                تست احراز هویت
              </Button>
              <Button type="button" variant="outline" onClick={handleClearTokens}>
                پاک کردن توکن‌ها
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات دیباگ</CardTitle>
          <CardDescription>
            وضعیت فعلی احراز هویت
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugger;
