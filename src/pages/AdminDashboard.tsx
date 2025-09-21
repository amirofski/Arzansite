import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/lib/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Package, 
  DollarSign, 
  Mail, 
  Settings, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Globe,
  Activity,
  Server,
  RefreshCw,
  Database
} from 'lucide-react';
import Layout from '@/components/ui/Layout';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteMode } from '@/hooks/useSiteMode';
import SiteModeDisplay from '@/components/ui/SiteModeDisplay';
// Removed unused frontend email templating utilities; keep only adminService usage for emails
// Removed legacy service imports; using consolidated services via '@/lib/services'
import AdminInvoiceManager from '@/components/admin/AdminInvoiceManager';
import OrderCard from '@/components/dashboard/OrderCard';
import AdminReceiptManager from '@/components/admin/AdminReceiptManager';
import AdminWalletAdjustmentDialog from '@/components/admin/AdminWalletAdjustmentDialog';
import AdminPaymentLogs from '@/components/admin/AdminPaymentLogs';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import type { AdminUser, AdminOrder, AdminEmailLog, AdminWallet, AdminWalletAdjustment } from '@/lib/services';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnimatedLoader from '@/components/ui/AnimatedLoader';


const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { mode, updateSiteMode } = useSiteMode();
  
  // State for different data
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [emailLogs, setEmailLogs] = useState<AdminEmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  
  // Search states
  const [ordersSearchTerm, setOrdersSearchTerm] = useState('');
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [emailLogsSearchTerm, setEmailLogsSearchTerm] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeUsers: 0,
    emailSentToday: 0,
    averageOrderValue: 0
  });

  const [selectedTab, setSelectedTab] = useState<string>('orders');

  // New state for enhanced features
  const [domainPrices, setDomainPrices] = useState<{ id: string; extension: string; price: number; description?: string; available?: boolean; category?: string }[]>([]);
  type SystemMetricsView = { system?: { uptime?: number; memoryUsage?: number; cpuUsage?: number }; database?: { responseTime?: number }; services?: { email?: { status?: string }; payment?: { status?: string } } };
  const [systemMetrics, setSystemMetrics] = useState<SystemMetricsView | null>(null);
  const [domainCheckDialog, setDomainCheckDialog] = useState(false);
  const [newDomainDialog, setNewDomainDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [domainToCheck, setDomainToCheck] = useState({ domain: '', extension: '.ir' });
  const [newDomainData, setNewDomainData] = useState({ extension: '', price: '', description: '', category: 'generic' as 'generic' | 'country' | 'specialized' });
  const [deleteUserReason, setDeleteUserReason] = useState('');
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingSystemMetrics, setLoadingSystemMetrics] = useState(false);

  // Wallets tab state
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletsSearchTerm, setWalletsSearchTerm] = useState('');
  const [walletsPage, setWalletsPage] = useState(1);
  const [walletsLimit, setWalletsLimit] = useState(10);
  const [walletsPagination, setWalletsPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(null);
  const [adjustments, setAdjustments] = useState<AdminWalletAdjustment[]>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  // useEffect to load data (placed after callbacks to avoid temporal dead zone)

  

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const ordersData = await adminService.getOrders({ admin: true });
      setOrders(ordersData.items || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const usersData = await adminService.getAllProfiles();
      setUsers((usersData as any)?.items || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchEmailLogs = useCallback(async () => {
    setEmailLogsLoading(true);
    try {
      const logsData = await adminService.getEmailLogs(100, 0);
      setEmailLogs(logsData.items || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setEmailLogsLoading(false);
    }
  }, []);

  // Wallets fetchers
  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true);
    try {
      const resp = await adminService.getWallets({ page: walletsPage, limit: walletsLimit, search: walletsSearchTerm || undefined });
      setWallets(resp.items || []);
      setWalletsPagination(resp.pagination || null);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({ title: 'خطا در دریافت کیف پول‌ها', variant: 'destructive' });
    } finally {
      setWalletsLoading(false);
    }
  }, [walletsPage, walletsLimit, walletsSearchTerm, toast]);

  const fetchWalletAdjustments = useCallback(async (wallet: AdminWallet) => {
    setSelectedWallet(wallet);
    setAdjustmentsLoading(true);
    try {
      const resp = await adminService.getWalletAdjustments(wallet.$id, { page: 1, limit: 10 });
      setAdjustments(resp.items || []);
    } catch (error) {
      console.error('Error fetching wallet adjustments:', error);
      toast({ title: 'خطا در دریافت سوابق تنظیم', variant: 'destructive' });
    } finally {
      setAdjustmentsLoading(false);
    }
  }, [toast]);

  const calculateStats = useCallback(async () => {
    try {
      const allOrders = await adminService.getOrders({ admin: true });
      const allUsersRaw = await adminService.getAllProfiles();
      const allUsers = allUsersRaw.items || [];
      const orders = allOrders.items || [];
      
      const totalOrders = orders.length;
      const totalUsers = allUsers.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const activeUsers = allUsers.filter(user => user.role === 'user').length;
      
      // Calculate email sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const emailLogsArray = Array.isArray(emailLogs) ? emailLogs : [];
      const emailSentToday = emailLogsArray.filter(log => {
        const logDate = new Date(log.sent_at);
        return logDate >= today;
      }).length;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalOrders,
        totalUsers,
        totalRevenue,
        pendingOrders,
        completedOrders,
        activeUsers,
        emailSentToday,
        averageOrderValue
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }, [emailLogs]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchUsers(),
        // Lazy-load email logs when the Emails tab is opened
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'خطا در بارگیری اطلاعات',
        description: 'مشکلی در دریافت اطلاعات پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, fetchUsers, calculateStats, toast]);

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await adminService.updateOrder(orderId, { status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' });
      await fetchOrders();
      toast({
        title: 'وضعیت سفارش بروزرسانی شد',
        description: 'وضعیت سفارش با موفقیت تغییر یافت',
      });
    } catch (error) {
      toast({
        title: 'خطا در بروزرسانی وضعیت',
        description: 'مشکلی در تغییر وضعیت سفارش پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await adminService.deleteOrder(orderId);
      await fetchOrders();
      toast({
        title: 'سفارش حذف شد',
        description: 'سفارش با موفقیت حذف شد',
      });
    } catch (error) {
      toast({
        title: 'خطا در حذف سفارش',
        description: 'مشکلی در حذف سفارش پیش آمد',
        variant: 'destructive',
      });
    }
  };



  const testEmailService = async () => {
    try {
      const result = await adminService.testEmailService({
        to: user?.email || 'admin@arzansite.com',
        subject: 'Test Email',
        template: 'test',
        data: { message: 'This is a test email from the admin dashboard' }
      });
      
      if (result.success) {
        toast({
          title: 'تست موفق',
          description: result.message || 'تست سرویس ایمیل با موفقیت انجام شد',
          variant: 'default',
        });
      } else {
        toast({
          title: 'تست ناموفق',
          description: result.message || 'مشکلی در تست سرویس ایمیل پیش آمد',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطا در تست سرویس ایمیل',
        description: 'مشکلی در تست سرویس ایمیل پیش آمد',
        variant: 'destructive',
      });
    }
  };

  // New enhanced functions
  const fetchDomainPrices = useCallback(async () => {
          setLoadingDomains(true);
      try {
        const data = await adminService.getDomainPrices();
        setDomainPrices(data.items || []);
      } catch (error) {
      console.error('Error fetching domain prices:', error);
      toast({
        title: 'خطا در دریافت قیمت دامنه‌ها',
        description: 'مشکلی در دریافت اطلاعات دامنه‌ها پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoadingDomains(false);
    }
  }, [toast]);

  const fetchSystemMetrics = useCallback(async () => {
    setLoadingSystemMetrics(true);
    try {
      const metrics = await adminService.getSystemMetrics();
      // Render minimal placeholder, map only fields we show
      setSystemMetrics({
        system: { uptime: Number(metrics?.system?.uptime || 0), memoryUsage: Number(metrics?.system?.memoryUsage || 0), cpuUsage: Number(metrics?.system?.cpuUsage || 0) },
        database: { responseTime: Number(metrics?.database?.responseTime || 0) },
        services: {
          email: { status: metrics?.services?.email?.status },
          payment: { status: metrics?.services?.payment?.status },
        },
      });
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: 'خطا در دریافت آمار سیستم',
        description: 'مشکلی در دریافت آمار سیستم پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoadingSystemMetrics(false);
    }
  }, [toast]);

  // useEffect to load data (placed after callbacks to avoid temporal dead zone)
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData();
      fetchDomainPrices();
      fetchSystemMetrics();
      fetchWallets();
    }
  }, [user, fetchAllData, fetchDomainPrices, fetchSystemMetrics, fetchWallets]);

  // Lazy-load email logs when Emails tab is opened
  useEffect(() => {
    if (selectedTab === 'emails' && !emailLogsLoading && (!emailLogs || emailLogs.length === 0)) {
      fetchEmailLogs();
    }
  }, [selectedTab, emailLogsLoading, emailLogs, fetchEmailLogs]);

  const updateDomainPrice = async (extensionId: string, newPrice: number) => {
    try {
      await adminService.updateDomainPrice(extensionId, { price: newPrice });
      await fetchDomainPrices();
      toast({
        title: 'قیمت بروزرسانی شد',
        description: 'قیمت دامنه با موفقیت تغییر یافت',
      });
    } catch (error) {
      toast({
        title: 'خطا در بروزرسانی قیمت',
        description: 'مشکلی در تغییر قیمت دامنه پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const createNewDomainExtension = async () => {
    if (!newDomainData.extension || !newDomainData.price || !newDomainData.description) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminService.createDomainExtension({
        extension: newDomainData.extension,
        price: parseInt(newDomainData.price),
        description: newDomainData.description,
        category: newDomainData.category
      });
      
      await fetchDomainPrices();
      setNewDomainDialog(false);
      setNewDomainData({ extension: '', price: '', description: '', category: 'generic' });
      
      toast({
        title: 'دامنه جدید اضافه شد',
        description: 'پسوند دامنه جدید با موفقیت اضافه شد',
      });
    } catch (error) {
      toast({
        title: 'خطا در افزودن دامنه',
        description: 'مشکلی در افزودن پسوند دامنه پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const checkDomainAvailability = async () => {
    if (!domainToCheck.domain) {
      toast({
        title: 'خطا',
        description: 'لطفاً نام دامنه را وارد کنید',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await adminService.checkDomainAvailability(domainToCheck);
      toast({
        title: result.available ? 'دامنه در دسترس است' : 'دامنه در دسترس نیست',
        description: `${domainToCheck.domain}${domainToCheck.extension} ${result.available ? 'قابل ثبت است' : 'قبلاً ثبت شده است'}`,
        variant: result.available ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'خطا در بررسی دامنه',
        description: 'مشکلی در بررسی در دسترس بودن دامنه پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const handleBanUser = async (u: AdminUser) => {
    try {
      const res = await adminService.banUser(u.id);
      if (res.success) {
        toast({ title: 'کاربر مسدود شد', description: `وضعیت: ${res.status}` });
        fetchUsers();
      } else {
        throw new Error('Ban failed');
      }
    } catch (error: any) {
      toast({ title: 'خطا در مسدودسازی', description: error?.message || 'مشکلی پیش آمد', variant: 'destructive' });
    }
  };

  const handleUnbanUser = async (u: AdminUser) => {
    try {
      const res = await adminService.unbanUser(u.id);
      if (res.success) {
        toast({ title: 'کاربر آزاد شد', description: `وضعیت: ${res.status}` });
        fetchUsers();
      } else {
        throw new Error('Unban failed');
      }
    } catch (error: any) {
      toast({ title: 'خطا در رفع انسداد', description: error?.message || 'مشکلی پیش آمد', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'in_progress': return 'در حال انجام';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  // Filter functions
  const filterOrders = (order: AdminOrder, searchTerm: string) => {
    return order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           getStatusText(order.status).toLowerCase().includes(searchTerm.toLowerCase());
  };

  const filterUsers = (user: AdminUser, searchTerm: string) => {
    return user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filterEmailLogs = (log: AdminEmailLog, searchTerm: string) => {
    return (log.to || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.status || '').toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Use pagination hooks
  const {
    currentItems: currentOrders,
    totalPages: ordersTotalPages,
    currentPage: ordersCurrentPage,
    setCurrentPage: setOrdersCurrentPage,
    totalItems: ordersTotalItems
  } = usePagination({
    data: orders,
    itemsPerPage: 10,
    searchTerm: ordersSearchTerm,
    filterFunction: filterOrders
  });

  const {
    currentItems: currentUsers,
    totalPages: usersTotalPages,
    currentPage: usersCurrentPage,
    setCurrentPage: setUsersCurrentPage,
    totalItems: usersTotalItems
  } = usePagination({
    data: users,
    itemsPerPage: 10,
    searchTerm: usersSearchTerm,
    filterFunction: filterUsers
  });

  const {
    currentItems: currentEmailLogs,
    totalPages: emailLogsTotalPages,
    currentPage: emailLogsCurrentPage,
    setCurrentPage: setEmailLogsCurrentPage,
    totalItems: emailLogsTotalItems
  } = usePagination({
    data: emailLogs,
    itemsPerPage: 10,
    searchTerm: emailLogsSearchTerm,
    filterFunction: filterEmailLogs
  });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AnimatedLoader size='lg' />
            <p className="mt-4 text-muted-foreground">در حال بارگیری...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">دسترسی غیرمجاز</h1>
            <p className="text-muted-foreground">شما مجاز به دسترسی به این صفحه نیستید</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>داشبورد مدیریت - ارزان سایت</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              داشبورد مدیریت
            </h1>
            <p className="text-muted-foreground">
              مدیریت کامل سیستم و نظارت بر عملکرد
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل سفارشات</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingOrders} در انتظار
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} فعال
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  میانگین: {formatPrice(stats.averageOrderValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ایمیل امروز</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.emailSentToday}</div>
                <p className="text-xs text-muted-foreground">
                  ارسال شده
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Site Mode Control */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                تنظیمات سایت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SiteModeDisplay mode={mode} />
            </CardContent>
          </Card>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-11">
              <TabsTrigger value="orders">سفارشات</TabsTrigger>
              <TabsTrigger value="users">کاربران</TabsTrigger>
              <TabsTrigger value="emails">ایمیل‌ها</TabsTrigger>
              <TabsTrigger value="stats">آمار</TabsTrigger>
              <TabsTrigger value="system-health">وضعیت سیستم</TabsTrigger>
              <TabsTrigger value="invoices">فاکتورها</TabsTrigger>
              <TabsTrigger value="receipts">رسیدها</TabsTrigger>
              <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
              <TabsTrigger value="wallets">کیف پول‌ها</TabsTrigger>
              <TabsTrigger value="domains">دامنه‌ها</TabsTrigger>
              <TabsTrigger value="tools">ابزارها</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold">مدیریت سفارشات</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="جستجو در سفارشات..."
                      value={ordersSearchTerm}
                      onChange={(e) => setOrdersSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button onClick={fetchOrders} variant="outline">
                    بروزرسانی
                  </Button>
                </div>
              </div>

              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : currentOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">هیچ سفارشی یافت نشد</h3>
                      <p className="text-muted-foreground">
                        {ordersSearchTerm ? `سفارشی با عبارت "${ordersSearchTerm}" پیدا نشد` : 'هنوز هیچ سفارشی ثبت نشده است'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {currentOrders.map((order) => {
                    // Map AdminOrder to user Order shape for OrderCard
                    const mappedOrder: any = {
                      id: (order as any).id,
                      title: (order as any).title,
                      description: (order as any).description,
                      price: Number((order as any).price || 0),
                      status: (order as any).status || 'pending',
                      paymentStatus: (order as any).payment_status || (order as any).paymentStatus,
                      comments: (order as any).comments,
                      totalPages: (order as any).total_pages || (order as any).totalPages,
                      totalSections: (order as any).total_sections || (order as any).totalSections,
                      userId: (order as any).user_id,
                      siteType: (order as any).site_type || (order as any).siteType,
                      sessionId: (order as any).session_id || (order as any).sessionId,
                      wizardData: (order as any).wizardData || (order as any).wizard_data,
                      createdAt: (order as any).created_at || (order as any).createdAt,
                      updatedAt: (order as any).updated_at || (order as any).updatedAt,
                    };

                    return (
                      <div key={(order as any).id} className="space-y-2">
                        <OrderCard
                          order={mappedOrder}
                          hidePayButton
                          onRefresh={fetchOrders}
                          onDeleted={() => fetchOrders()}
                          onDeleteRequest={async (id) => { await adminService.deleteOrder(id); }}
                        />
                        <div className="flex justify-end gap-2">
                          <Badge className={`${getStatusColor(order.status)} border-0`}>
                            {getStatusText(order.status)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOrderStatusUpdate(order.id, 'completed')}
                          >
                            <CheckCircle className="w-4 h-4" /> تکمیل سفارش
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <PaginationControls
                    currentPage={ordersCurrentPage}
                    totalPages={ordersTotalPages}
                    onPageChange={setOrdersCurrentPage}
                    totalItems={ordersTotalItems}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold">مدیریت کاربران</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="جستجو در کاربران..."
                      value={usersSearchTerm}
                      onChange={(e) => setUsersSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button onClick={fetchUsers} variant="outline">
                    بروزرسانی
                  </Button>
                </div>
              </div>

              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : currentUsers.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">هیچ کاربری یافت نشد</h3>
                      <p className="text-muted-foreground">
                        {usersSearchTerm ? `کاربری با عبارت "${usersSearchTerm}" پیدا نشد` : 'هنوز هیچ کاربری ثبت نشده است'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentUsers.map((user) => (
                    <Card key={user.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={(user as any).avatar_url || ''} alt={user.full_name || user.email} />
                                <AvatarFallback>{(user.full_name || user.email || '?').slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">
                                  {user.full_name || (user as any).fullName || user.email}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {user.email}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? 'مدیر' : 'کاربر'}
                            </Badge>
                            <Badge variant={(user as any).status === 'banned' ? 'destructive' : 'outline'}>
                              {(user as any).status || 'active'}
                            </Badge>
                            {((user as any).status === 'banned') ? (
                              <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user)}>رفع انسداد</Button>
                            ) : (
                              <Button variant="destructive" size="sm" onClick={() => handleBanUser(user)}>مسدود کردن</Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">نقش: </span>
                            {user.role === 'admin' ? 'مدیر' : 'کاربر'}
                          </div>
                          <div>
                            <span className="font-medium">وضعیت: </span>
                            {(user as any).status || 'active'}
                          </div>
                          <div>
                            <span className="font-medium">تلفن: </span>
                            {(user as any).phone || '—'}
                          </div>
                          <div>
                            <span className="font-medium">تأیید ایمیل: </span>
                            {(user as any).verification_status || '—'}
                          </div>
                          <div>
                            <span className="font-medium">تاریخ عضویت: </span>
                            {formatDate((user as any).created_at || (user as any).createdAt)}
                          </div>
                          <div>
                            <span className="font-medium">آخرین ورود: </span>
                            {formatDate((user as any).last_login_at || (user as any).lastLoginAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <PaginationControls
                    currentPage={usersCurrentPage}
                    totalPages={usersTotalPages}
                    onPageChange={setUsersCurrentPage}
                    totalItems={usersTotalItems}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="emails" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold">لاگ ایمیل‌ها</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="جستجو در ایمیل‌ها..."
                      value={emailLogsSearchTerm}
                      onChange={(e) => setEmailLogsSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button onClick={fetchEmailLogs} variant="outline">
                    بروزرسانی
                  </Button>
                  <Button onClick={testEmailService} variant="outline">
                    تست سرویس
                  </Button>
                </div>
              </div>

              {emailLogsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : currentEmailLogs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">هیچ ایمیلی یافت نشد</h3>
                      <p className="text-muted-foreground">
                        {emailLogsSearchTerm ? `ایمیلی با عبارت "${emailLogsSearchTerm}" پیدا نشد` : 'هنوز هیچ ایمیلی ارسال نشده است'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentEmailLogs.map((log) => (
                    <Card key={log.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{log.subject}</CardTitle>
                            <CardDescription className="mt-2">
                              {log.to}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                              {log.status === 'sent' ? 'ارسال شده' : 'ناموفق'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">وضعیت: </span>
                            {log.status === 'sent' ? 'ارسال شده' : 'ناموفق'}
                          </div>
                          <div>
                            <span className="font-medium">تاریخ ارسال: </span>
                            {formatDate(log.sent_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <PaginationControls
                    currentPage={emailLogsCurrentPage}
                    totalPages={emailLogsTotalPages}
                    onPageChange={setEmailLogsCurrentPage}
                    totalItems={emailLogsTotalItems}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">آمار سیستم</h2>
                <Button onClick={fetchSystemMetrics} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بروزرسانی
                </Button>
              </div>
              <AdminDashboardStats />
            </TabsContent>

            <TabsContent value="system-health" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">وضعیت سیستم</h2>
                <Button onClick={fetchSystemMetrics} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بروزرسانی
                </Button>
              </div>
              
              {loadingSystemMetrics ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">در حال دریافت آمار سیستم...</p>
                </div>
              ) : systemMetrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* System Status */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">وضعیت سیستم</CardTitle>
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.floor((systemMetrics?.system?.uptime || 0) / 3600)} ساعت</div>
                      <p className="text-xs text-muted-foreground">آپتایم</p>
                    </CardContent>
                  </Card>

                  {/* Memory Usage */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">استفاده از حافظه</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Number(systemMetrics?.system?.memoryUsage || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">حافظه استفاده شده</p>
                    </CardContent>
                  </Card>

                  {/* CPU Usage */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">استفاده از CPU</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Number(systemMetrics?.system?.cpuUsage || 0).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">CPU استفاده شده</p>
                    </CardContent>
                  </Card>

                  {/* Database Status */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">وضعیت دیتابیس</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemMetrics?.database?.responseTime ?? 0}ms</div>
                      <p className="text-xs text-muted-foreground">زمان پاسخ</p>
                    </CardContent>
                  </Card>

                  {/* Email Service */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">سرویس ایمیل</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemMetrics?.services?.email?.status || '—'}</div>
                      <p className="text-xs text-muted-foreground">وضعیت سرویس</p>
                    </CardContent>
                  </Card>

                  {/* Payment Service */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">سرویس پرداخت</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{systemMetrics?.services?.payment?.status || '—'}</div>
                      <p className="text-xs text-muted-foreground">وضعیت سرویس</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">خطا در بارگیری آمار سیستم</h3>
                      <p className="text-muted-foreground mb-4">
                        آمار سیستم در دسترس نیست
                      </p>
                      <Button onClick={fetchSystemMetrics} variant="outline">
                        <RefreshCw className="w-4 h-4 ml-2" />
                        تلاش مجدد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">مدیریت فاکتورها</h2>
              </div>
              <AdminInvoiceManager />
            </TabsContent>

            <TabsContent value="receipts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">مدیریت رسیدها</h2>
              </div>
              <AdminReceiptManager />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">لاگ پرداخت‌ها</h2>
              </div>
              <AdminPaymentLogs />
            </TabsContent>

            <TabsContent value="wallets" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold">مدیریت کیف پول‌ها</h2>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="جستجو (نام/ایمیل/شناسه کاربر)..."
                      value={walletsSearchTerm}
                      onChange={(e) => setWalletsSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button onClick={() => { setWalletsPage(1); fetchWallets(); }} variant="outline">
                    بروزرسانی
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>لیست کیف پول‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  {walletsLoading ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">در حال بارگیری...</div>
                  ) : wallets.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">کیف پولی یافت نشد</div>
                  ) : (
                    <div className="space-y-3">
                      {wallets.map((w) => (
                        <div key={w.$id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{w.userProfile?.full_name || w.user_id}</span>
                              {w.userProfile?.email && (
                                <span className="text-xs text-muted-foreground">{w.userProfile.email}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">ایجاد: {formatDate(w.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium whitespace-nowrap">{formatPrice(w.balance)}</div>
                            <Button size="sm" variant="outline" onClick={() => fetchWalletAdjustments(w)}>سوابق</Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedWallet(w); setAdjustDialogOpen(true); }}>تنظیم موجودی</Button>
                          </div>
                        </div>
                      ))}

                      {walletsPagination && (
                        <PaginationControls
                          currentPage={walletsPagination.page}
                          totalPages={walletsPagination.pages}
                          onPageChange={(p) => { setWalletsPage(p); fetchWallets(); }}
                          totalItems={walletsPagination.total}
                          itemsPerPage={walletsPagination.limit}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedWallet && (
                <Card>
                  <CardHeader>
                    <CardTitle>سوابق تنظیم موجودی - {selectedWallet.userProfile?.full_name || selectedWallet.user_id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adjustmentsLoading ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">در حال بارگیری...</div>
                    ) : adjustments.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">سابقه‌ای یافت نشد</div>
                    ) : (
                      <div className="space-y-2">
                        {adjustments.map((adj) => (
                          <div key={adj.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{adj.type === 'credit' ? 'افزایش' : adj.type === 'debit' ? 'کاهش' : 'تصحیح'}</span>
                                <span className="text-xs text-muted-foreground">توسط: {adj.adminName || adj.adminId}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">{adj.reason}</div>
                              <div className="text-xs text-muted-foreground mt-1">{formatDate(adj.created_at)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium whitespace-nowrap">{formatPrice(adj.amount)}</div>
                              <div className="text-xs text-muted-foreground">{formatPrice(adj.balanceBefore)} → {formatPrice(adj.balanceAfter)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <AdminWalletAdjustmentDialog
                open={adjustDialogOpen}
                onOpenChange={setAdjustDialogOpen}
                walletId={selectedWallet?.$id || ''}
                userName={selectedWallet?.userProfile?.full_name || selectedWallet?.user_id || ''}
                currentBalance={selectedWallet?.balance || 0}
                onAdjustmentComplete={() => { fetchWallets(); if (selectedWallet) fetchWalletAdjustments(selectedWallet); }}
              />
            </TabsContent>

            <TabsContent value="domains" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">مدیریت قیمت دامنه‌ها</h2>
                <Button onClick={() => setNewDomainDialog(true)} variant="outline">
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن دامنه جدید
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>قیمت‌گذاری دامنه‌ها</CardTitle>
                  <CardDescription>
                    قیمت دامنه‌های مختلف را برای نمایش به کاربران تنظیم کنید
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {loadingDomains ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">در حال بارگیری دامنه‌ها...</p>
                      </div>
                    ) : (
                      <>
                        {/* Domain Extensions List */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">پسوندهای دامنه</h4>
                          
                          {(Array.isArray(domainPrices) ? domainPrices : []).map((domain) => (
                            <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h5 className="font-medium">دامنه {domain.extension}</h5>
                                <p className="text-sm text-muted-foreground">{domain.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={domain.available ? 'default' : 'secondary'}>
                                    {domain.available ? 'فعال' : 'غیرفعال'}
                                  </Badge>
                                  <Badge variant="outline">{domain.category}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input 
                                  type="number" 
                                  placeholder="قیمت به تومان"
                                  className="w-32"
                                  defaultValue={domain.price}
                                  onChange={(e) => {
                                    const newPrice = parseInt(e.target.value);
                                    if (!isNaN(newPrice) && newPrice >= 0) {
                                      updateDomainPrice(domain.id, newPrice);
                                    }
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => fetchDomainPrices()}
                                >
                                  بروزرسانی
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Domain Availability Check */}
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-3">بررسی در دسترس بودن دامنه</h4>
                          <div className="flex gap-3">
                            <Input 
                              type="text" 
                              placeholder="نام دامنه مورد نظر"
                              className="flex-1"
                              value={domainToCheck.domain}
                              onChange={(e) => setDomainToCheck(prev => ({ ...prev, domain: e.target.value }))}
                            />
                            <Select 
                              value={domainToCheck.extension} 
                              onValueChange={(value) => setDomainToCheck(prev => ({ ...prev, extension: value }))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Array.isArray(domainPrices) ? domainPrices : []).map((domain) => (
                                  <SelectItem key={domain.id} value={domain.extension}>
                                    {domain.extension}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={checkDomainAvailability}>
                              بررسی
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">ابزارهای مدیریتی</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      تست سرویس ایمیل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      بررسی وضعیت سرویس ایمیل و اطمینان از عملکرد صحیح
                    </p>
                    <Button onClick={testEmailService} className="w-full">
                      اجرای تست
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      آمار سیستم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      مشاهده آمار کلی سیستم و عملکرد
                    </p>
                    <Button onClick={calculateStats} className="w-full">
                      بروزرسانی آمار
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      تنظیمات سایت
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      تغییر وضعیت سایت و تنظیمات عمومی
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => updateSiteMode('normal')} 
                        variant={mode === 'normal' ? 'default' : 'outline'}
                        className="w-full"
                      >
                        حالت عادی
                      </Button>
                      <Button 
                        onClick={() => updateSiteMode('temporarily_unavailable')} 
                        variant={mode === 'temporarily_unavailable' ? 'default' : 'outline'}
                        className="w-full"
                      >
                        حالت تعمیر
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* New Domain Extension Dialog */}
      <Dialog open={newDomainDialog} onOpenChange={setNewDomainDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن پسوند دامنه جدید</DialogTitle>
            <DialogDescription>
              پسوند دامنه جدید و قیمت آن را اضافه کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="extension">پسوند دامنه</Label>
              <Input
                id="extension"
                placeholder="مثال: .io"
                value={newDomainData.extension}
                onChange={(e) => setNewDomainData(prev => ({ ...prev, extension: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="price">قیمت (تومان)</Label>
              <Input
                id="price"
                type="number"
                placeholder="مثال: 800000"
                value={newDomainData.price}
                onChange={(e) => setNewDomainData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">توضیحات</Label>
              <Input
                id="description"
                placeholder="توضیحات پسوند دامنه"
                value={newDomainData.description}
                onChange={(e) => setNewDomainData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="category">دسته‌بندی</Label>
              <Select 
                value={newDomainData.category} 
                onValueChange={(value: 'country' | 'generic' | 'specialized') => 
                  setNewDomainData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="country">کشوری</SelectItem>
                  <SelectItem value="generic">عمومی</SelectItem>
                  <SelectItem value="specialized">تخصصی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewDomainDialog(false)}
            >
              انصراف
            </Button>
            <Button onClick={createNewDomainExtension}>
              افزودن دامنه
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ open, user: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حذف کاربر</DialogTitle>
            <DialogDescription>
              آیا از حذف کاربر "{deleteUserDialog.user?.full_name || deleteUserDialog.user?.email}" اطمینان دارید؟
              این عملیات غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-reason">دلیل حذف *</Label>
              <Textarea
                id="delete-reason"
                placeholder="دلیل حذف کاربر را وارد کنید..."
                value={deleteUserReason}
                onChange={(e) => setDeleteUserReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteUserDialog({ open: false, user: null })}
            >
              انصراف
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteUserDialog.user && handleDeleteUser(deleteUserDialog.user)}
              disabled={!deleteUserReason.trim()}
            >
              حذف کاربر
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
export default AdminDashboard;



