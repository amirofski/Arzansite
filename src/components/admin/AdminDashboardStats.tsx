import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminService, type AdminStats, type SystemMetrics } from '@/lib/services';
import { 
  Users, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw,
  ShoppingCart,
  Mail,
  Clock
} from 'lucide-react';
import { AnimatedLoader } from '@/components/ui/AnimatedLoader';

const AdminDashboardStats: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dashboardStats, metrics] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getSystemMetrics().catch(() => null) // Gracefully handle if metrics not available
      ]);
      setStats(dashboardStats);
      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: 'خطا در دریافت آمار',
        description: 'مشکلی در دریافت آمار داشبورد پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <AnimatedLoader size="xl" variant="gradient2" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطا در بارگیری آمار</h3>
            <p className="text-muted-foreground mb-4">
              آمار داشبورد در دسترس نیست
            </p>
            <Button onClick={fetchStats} variant="outline">
              <RefreshCw className="w-4 h-4 ml-2" />
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">آمار کلی سیستم</h2>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 ml-2" />
          بروزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              کاربران ثبت‌نام شده
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل سفارشات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalOrders)}</div>
            <p className="text-xs text-muted-foreground">
              سفارشات ثبت شده
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              مجموع درآمد سیستم
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سفارشات در انتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.pendingOrders)}</div>
            <p className="text-xs text-muted-foreground">
              سفارشات در حال پردازش
            </p>
          </CardContent>
        </Card>

        {/* Email Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ایمیل‌های ارسالی</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.emailSentToday || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ایمیل‌های امروز
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">وضعیت سفارشات</CardTitle>
            <CardDescription>
              خلاصه وضعیت سفارشات سیستم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">سفارشات در انتظار:</span>
                <span className="font-medium">{formatNumber(stats.pendingOrders)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">سفارشات تکمیل شده:</span>
                <span className="font-medium text-green-600">{formatNumber(stats.completedOrders)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">میانگین ارزش سفارش:</span>
                <span className="font-medium">
                  {stats.totalOrders > 0 
                    ? formatAmount(Math.round(stats.totalRevenue / stats.totalOrders))
                    : '0 تومان'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آمار کاربران</CardTitle>
            <CardDescription>
              خلاصه وضعیت کاربران سیستم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">کل کاربران:</span>
                <span className="font-medium">{formatNumber(stats.totalUsers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">کاربران فعال:</span>
                <span className="font-medium text-green-600">{formatNumber(stats.activeUsers)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">نرخ فعالیت:</span>
                <span className="font-medium">
                  {stats.totalUsers > 0 
                    ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آمار مالی</CardTitle>
            <CardDescription>
              خلاصه وضعیت مالی سیستم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">درآمد کل:</span>
                <span className="font-medium">{formatAmount(stats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">میانگین سفارش:</span>
                <span className="font-medium">
                  {stats.totalOrders > 0 
                    ? formatAmount(Math.round(stats.totalRevenue / stats.totalOrders))
                    : '0 تومان'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">ایمیل‌های امروز:</span>
                <span className="font-medium">{formatNumber(stats.emailSentToday || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics (if available) */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">وضعیت سیستم</CardTitle>
            <CardDescription>
              آمار عملکرد سیستم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemMetrics.uptime}</div>
                <div className="text-sm text-muted-foreground">زمان فعالیت</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(systemMetrics.total_users)}</div>
                <div className="text-sm text-muted-foreground">کاربران کل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatNumber(systemMetrics.total_orders)}</div>
                <div className="text-sm text-muted-foreground">سفارشات کل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatAmount(systemMetrics.total_revenue)}</div>
                <div className="text-sm text-muted-foreground">درآمد کل</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboardStats;
