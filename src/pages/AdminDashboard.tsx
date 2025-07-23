import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Package, Search, Trash2, Edit, Shield, Settings, Eye } from 'lucide-react';
import Layout from '@/components/ui/Layout';
import { useToast } from '@/hooks/use-toast';
import { useSiteMode, type SiteMode } from '@/hooks/useSiteMode';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  user_roles: {
    role: string;
  }[];
}

interface Order {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  comments: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const { mode, updateSiteMode } = useSiteMode();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all profiles with user roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const profilesWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        user_roles: rolesData?.filter(role => role.user_id === profile.user_id) || []
      }));

      setProfiles(profilesWithRoles);

      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Combine orders with profile data
      const ordersWithProfiles = (ordersData || []).map(order => {
        const profile = profilesData?.find(p => p.user_id === order.user_id);
        return {
          ...order,
          profiles: profile ? {
            full_name: profile.full_name,
            email: profile.email
          } : null
        };
      });

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطا در بارگیری اطلاعات',
        description: 'مشکلی در دریافت اطلاعات پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: 'وضعیت سفارش بروزرسانی شد',
        description: 'وضعیت سفارش با موفقیت تغییر کرد',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'خطا در بروزرسانی',
        description: 'مشکلی در بروزرسانی وضعیت پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchData(); // Refresh data

      toast({
        title: 'نقش کاربر تغییر کرد',
        description: `نقش کاربر به ${newRole === 'admin' ? 'ادمین' : 'کاربر عادی'} تغییر کرد`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'خطا در تغییر نقش',
        description: 'مشکلی در تغییر نقش کاربر پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;

    try {
      // First delete from auth.users (this will cascade to other tables)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      await fetchData(); // Refresh data

      toast({
        title: 'کاربر حذف شد',
        description: 'کاربر با موفقیت حذف شد',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'خطا در حذف کاربر',
        description: 'مشکلی در حذف کاربر پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const handleSiteModeChange = async (newMode: SiteMode) => {
    const success = await updateSiteMode(newMode);
    if (success) {
      toast({
        title: 'حالت سایت تغییر کرد',
        description: `حالت سایت به "${getModeText(newMode)}" تغییر کرد`,
      });
    } else {
      toast({
        title: 'خطا در تغییر حالت',
        description: 'مشکلی در تغییر حالت سایت پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const getModeText = (mode: SiteMode) => {
    switch (mode) {
      case 'normal': return 'عادی';
      case 'temporarily_unavailable': return 'موقتاً غیرفعال';
      case 'update_mode': return 'حالت بروزرسانی';
      case 'development_mode': return 'حالت توسعه';
      default: return mode;
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگیری...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>پنل مدیریت - ارزان سایت</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">پنل مدیریت</h1>
            <p className="text-muted-foreground">
              مدیریت کاربران و سفارشات سیستم
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل کاربران</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profiles.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل سفارشات</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سفارشات فعال</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(order => order.status === 'pending' || order.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سفارشات تکمیل شده</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(order => order.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">مدیریت سفارشات</TabsTrigger>
              <TabsTrigger value="users">مدیریت کاربران</TabsTrigger>
              <TabsTrigger value="settings">تنظیمات سایت</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-2xl font-bold">مدیریت سفارشات</h2>
                <div className="flex gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو در سفارشات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="in_progress">در حال انجام</SelectItem>
                      <SelectItem value="completed">تکمیل شده</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6">
                {filteredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{order.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {order.description}
                          </CardDescription>
                          <p className="text-sm text-muted-foreground mt-2">
                            مشتری: {order.profiles?.full_name} ({order.profiles?.email})
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">در انتظار</SelectItem>
                              <SelectItem value="in_progress">در حال انجام</SelectItem>
                              <SelectItem value="completed">تکمیل شده</SelectItem>
                              <SelectItem value="cancelled">لغو شده</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge className={`${getStatusColor(order.status)} border-0`}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">قیمت: </span>
                          {order.price ? formatPrice(order.price) : 'نامشخص'}
                        </div>
                        <div>
                          <span className="font-medium">تاریخ ایجاد: </span>
                          {formatDate(order.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">آخرین بروزرسانی: </span>
                          {formatDate(order.updated_at)}
                        </div>
                      </div>
                      {order.comments && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <span className="font-medium text-sm">توضیحات: </span>
                          <p className="text-sm mt-1">{order.comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-2xl font-bold">مدیریت کاربران</h2>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در کاربران..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredProfiles.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{profile.full_name}</h3>
                            <Badge variant={profile.user_roles?.[0]?.role === 'admin' ? 'default' : 'secondary'}>
                              {profile.user_roles?.[0]?.role === 'admin' ? 'ادمین' : 'کاربر'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{profile.email}</p>
                          <p className="text-sm text-muted-foreground">
                            تاریخ عضویت: {formatDate(profile.created_at)}
                          </p>
                          {profile.phone && (
                            <p className="text-sm text-muted-foreground">تلفن: {profile.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserRole(profile.user_id, profile.user_roles?.[0]?.role || 'user')}
                          >
                            <Shield className="w-4 h-4 ml-2" />
                            {profile.user_roles?.[0]?.role === 'admin' ? 'حذف ادمین' : 'ادمین کردن'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteUser(profile.user_id)}
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">تنظیمات سایت</h2>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      حالت عملکرد سایت
                    </CardTitle>
                    <CardDescription>
                      تنظیم حالت عملکرد سایت برای کاربران
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium">حالت فعلی:</label>
                      <Badge variant="outline">{getModeText(mode)}</Badge>
                    </div>
                    <div className="flex gap-4">
                      <Select value={mode} onValueChange={handleSiteModeChange}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="انتخاب حالت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">عادی</SelectItem>
                          <SelectItem value="development_mode">حالت توسعه</SelectItem>
                          <SelectItem value="update_mode">حالت بروزرسانی</SelectItem>
                          <SelectItem value="temporarily_unavailable">موقتاً غیرفعال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      پیش‌نمایش صفحات
                    </CardTitle>
                    <CardDescription>
                      مشاهده و بررسی صفحات مختلف سایت
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <Button asChild variant="outline">
                        <a href="/404" target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4 ml-2" />
                          مشاهده صفحه 404
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="/wizard" target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4 ml-2" />
                          مشاهده صفحه ویزارد
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="/" target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4 ml-2" />
                          مشاهده صفحه اصلی
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;