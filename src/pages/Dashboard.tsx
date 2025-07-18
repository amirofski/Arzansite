import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, User, Calendar, DollarSign } from 'lucide-react';
import Layout from '@/components/ui/Layout';
import { useToast } from '@/hooks/use-toast';
import CreateOrderDialog from '@/components/dashboard/CreateOrderDialog';
import EditProfileDialog from '@/components/dashboard/EditProfileDialog';

interface Order {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number;
  comments: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch user orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
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
        <title>داشبورد کاربری - ارزان سایت</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              خوش آمدید، {profile?.full_name || user?.email}
            </h1>
            <p className="text-muted-foreground">
              از این صفحه می‌توانید سفارشات و اطلاعات حساب خود را مدیریت کنید
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(order => order.status === 'pending' || order.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مجموع هزینه</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(orders.reduce((sum, order) => sum + (order.price || 0), 0))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">سفارشات من</TabsTrigger>
              <TabsTrigger value="profile">اطلاعات حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">سفارشات من</h2>
                <Button onClick={() => setCreateOrderOpen(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  سفارش جدید
                </Button>
              </div>

              {orders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">سفارشی موجود نیست</h3>
                      <p className="text-muted-foreground mb-4">
                        شما هنوز هیچ سفارشی ندارید. اولین سفارش خود را ایجاد کنید
                      </p>
                      <Button onClick={() => setCreateOrderOpen(true)}>
                        <Plus className="w-4 h-4 ml-2" />
                        سفارش جدید
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{order.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {order.description}
                            </CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border-0`}>
                            {getStatusText(order.status)}
                          </Badge>
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
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">اطلاعات حساب</h2>
                <Button onClick={() => setEditProfileOpen(true)} variant="outline">
                  <User className="w-4 h-4 ml-2" />
                  ویرایش اطلاعات
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>اطلاعات شخصی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">نام کامل</label>
                      <p className="mt-1">{profile?.full_name || 'نامشخص'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ایمیل</label>
                      <p className="mt-1">{profile?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">شماره تلفن</label>
                      <p className="mt-1">{profile?.phone || 'نامشخص'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">آدرس</label>
                      <p className="mt-1">{profile?.address || 'نامشخص'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        onOrderCreated={fetchData}
      />

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={profile}
        onProfileUpdated={fetchData}
      />
    </Layout>
  );
};

export default Dashboard;