import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient, AdminDashboardStats } from '@/lib/api-client';
import { 
  Users, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';

const AdminDashboardStats: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dashboardStats, systemMetrics] = await Promise.all([
        apiClient.getAdminDashboardStats(),
        apiClient.getSystemMetrics()
      ]);
      setStats(dashboardStats);
      // You can also use systemMetrics here if needed
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-24 mt-2 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
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

        {/* Pending Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاکتورهای در انتظار</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.pendingInvoices)}</div>
            <p className="text-xs text-muted-foreground">
              فاکتورهای پرداخت نشده
            </p>
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاکتورهای سررسید</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.overdueInvoices)}</div>
            <p className="text-xs text-muted-foreground">
              فاکتورهای منقضی شده
            </p>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل تراکنش‌ها</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalTransactions)}</div>
            <p className="text-xs text-muted-foreground">
              تراکنش‌های مالی
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">وضعیت فاکتورها</CardTitle>
            <CardDescription>
              خلاصه وضعیت فاکتورهای سیستم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">فاکتورهای در انتظار:</span>
                <span className="font-medium">{formatNumber(stats.pendingInvoices)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">فاکتورهای سررسید:</span>
                <span className="font-medium text-red-600">{formatNumber(stats.overdueInvoices)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">نسبت سررسید:</span>
                <span className="font-medium">
                  {stats.pendingInvoices > 0 
                    ? `${((stats.overdueInvoices / stats.pendingInvoices) * 100).toFixed(1)}%`
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
                <span className="text-sm">کل تراکنش‌ها:</span>
                <span className="font-medium">{formatNumber(stats.totalTransactions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">میانگین تراکنش:</span>
                <span className="font-medium">
                  {stats.totalTransactions > 0 
                    ? formatAmount(Math.round(stats.totalRevenue / stats.totalTransactions))
                    : '0 تومان'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardStats;
