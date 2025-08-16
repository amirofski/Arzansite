import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Order, BackendUserProfile } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Package, User, Calendar, DollarSign, Search, Trash2, Palette } from 'lucide-react';
import Layout from '@/components/ui/Layout';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletService } from '@/lib/walletService';
import CreateOrderDialog from '@/components/dashboard/CreateOrderDialog';
import EditProfileDialog from '@/components/dashboard/EditProfileDialog';
import WalletCard from '@/components/dashboard/WalletCard';
import InvoiceList from '@/components/dashboard/InvoiceList';
import ReceiptList from '@/components/dashboard/ReceiptList';
import DesignPreview from '@/components/wizard/DesignPreview';
import OrderDesignPreview from '@/components/dashboard/OrderDesignPreview';
import { EmailVerificationPrompt } from '@/components/EmailVerificationPrompt';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<BackendUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  

     useEffect(() => {
     fetchData();
   }, [user]);

  // Check if user needs email verification
  useEffect(() => {
    // Since the login response shows emailVerified: true, 
    // we don't need to make an additional API call to check verification status
    // The user is already verified, so we won't show the verification prompt
    setShowVerificationPrompt(false);
  }, [user]);

     const fetchData = async () => {
     if (!user) {
       return;
     }

     try {
       // Fetch user profile first
       const profileData = await apiClient.getMyProfile();
       setProfile(profileData);

       // Fetch user orders with loading state
       await fetchOrders();
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

     const fetchOrders = async () => {
     if (!user) return;

     setOrdersLoading(true);
     try {
       const ordersData = await apiClient.getOrders({ mine: true });
       // Ensure ordersData is always an array
       if (Array.isArray(ordersData)) {
         // Filter out any invalid order objects
         const validOrders = ordersData.filter(order => 
           order && 
           typeof order === 'object' && 
           typeof order.id === 'string' &&
           typeof order.title === 'string' &&
           typeof order.status === 'string'
         );
         
         setOrders(validOrders);
       } else {
         setOrders([]);
       }
     } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'خطا در بارگیری سفارشات',
        description: 'مشکلی در دریافت سفارشات پیش آمد',
        variant: 'destructive',
      });
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const renderModuleLayoutPreview = (parsedData: Record<string, unknown>) => {
    if (!parsedData || typeof parsedData !== 'object') {
      console.warn('Invalid parsedData in renderModuleLayoutPreview:', parsedData);
      return null;
    }
    
    const modules = parsedData.moduleLayout || parsedData.modules;
    if (!modules || !Array.isArray(modules)) {
      console.warn('No valid modules found in renderModuleLayoutPreview:', modules);
      return null;
    }
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="text-sm font-medium mb-2">پیش‌نمایش ساختار سایت</div>
        <div className="flex flex-wrap gap-2">
          {modules.map((mod: Record<string, unknown>, idx: number) => {
            if (!mod || typeof mod !== 'object') {
              console.warn('Invalid module in renderModuleLayoutPreview:', mod);
              return null;
            }
            return (
              <div
                key={(mod.id as string) || idx}
                className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 rounded px-4 py-2 min-w-[80px]"
              >
                <span className="font-bold text-xs">{mod.name as string || 'نامشخص'}</span>
                <span className="text-[10px] text-muted-foreground">{mod.nameEn as string || 'Unknown'}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDesignPreview = (order: Order) => {
    if (!order || !order.description || typeof order.description !== 'string') {
      console.warn('Invalid order or description in renderDesignPreview:', order);
      return (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">توضیحات سفارش</span>
          </div>
          <p className="text-sm text-muted-foreground">توضیحات نامشخص</p>
        </div>
      );
    }
    
    try {
      const parsedData = JSON.parse(order.description);
      
      // Check for new dynamic design data first
      if (parsedData && typeof parsedData === 'object' && parsedData.websiteFramework?.dynamicDesign) {
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">پیش‌نمایش طراحی پویا</span>
              </div>
              <DesignPreview 
                design={parsedData.websiteFramework.dynamicDesign}
                showActions={false}
              />
            </div>
          </div>
        );
      }
      
      // Otherwise, show the summary/mockup
      if (parsedData && typeof parsedData === 'object' && 
          ((parsedData.moduleLayout && Array.isArray(parsedData.moduleLayout)) || 
           (parsedData.modules && Array.isArray(parsedData.modules)))) {
        return (
          <div className="space-y-4">
            {renderModuleLayoutPreview(parsedData)}
          </div>
        );
      }
      return (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">توضیحات سفارش</span>
          </div>
          <p className="text-sm text-muted-foreground">{order.description}</p>
        </div>
      );
    } catch (error) {
      // Fallback to original description if not JSON
      return (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">توضیحات سفارش</span>
          </div>
          <p className="text-sm text-muted-foreground">{order.description}</p>
        </div>
      );
    }
  };

  const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') {
      console.warn('Invalid status value in getStatusColor:', status);
      return 'bg-gray-100 text-gray-800';
    }
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (!status || typeof status !== 'string') {
      console.warn('Invalid status value:', status);
      return 'نامشخص';
    }
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'in_progress': return 'در حال انجام';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) {
      console.warn('Invalid price value in formatPrice:', price);
      return '0 تومان';
    }
    try {
      return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    } catch (error) {
      console.error('Error formatting price:', error, 'Price:', price);
      return '0 تومان';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') {
      console.warn('Invalid date string in formatDate:', dateString);
      return 'نامشخص';
    }
    try {
      return new Date(dateString).toLocaleDateString('fa-IR');
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'نامشخص';
    }
  };

  const formatOrderDescription = (description: string) => {
    if (!description || typeof description !== 'string') {
      console.warn('Invalid description in formatOrderDescription:', description);
      return <span className="text-sm text-muted-foreground">توضیحات نامشخص</span>;
    }
    
    try {
      const parsedData = JSON.parse(description);
      
      const siteTypeText = parsedData.siteType === 'personal' ? 'شخصی' : 'تجاری';
      const modulesCount = parsedData.modules?.length || 0;
      const hasLogo = parsedData.branding?.logo ? 'بله' : 'خیر';
      const domain = parsedData.userInfo?.domain || 'نامشخص';
      
      return (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-medium">نوع سایت:</span> {siteTypeText}</div>
            <div><span className="font-medium">دامنه:</span> {domain}</div>
            <div><span className="font-medium">تعداد ماژول:</span> {modulesCount}</div>
            <div><span className="font-medium">لوگو:</span> {hasLogo}</div>
          </div>
          {parsedData.modules && parsedData.modules.length > 0 && (
            <div>
              <span className="font-medium">ماژول‌ها:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(parsedData.modules) ? parsedData.modules.map((module: string, index: number) => {
                  if (typeof module !== 'string') {
                    console.warn('Invalid module in formatOrderDescription:', module);
                    return null;
                  }
                  return (
                    <span key={index} className="bg-muted px-2 py-1 rounded text-xs">
                      {module}
                    </span>
                  );
                }) : null}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error parsing order description:', error, 'Description:', description);
      // Fallback to original description if not JSON
      return <span className="text-sm text-muted-foreground">{description}</span>;
    }
  };

  // Filter function for orders
  const filterOrders = (order: Order, searchTerm: string) => {
    if (!order || !searchTerm) return true;
    
    // Validate order object structure
    if (typeof order !== 'object' || order === null) {
      console.warn('Invalid order object in filterOrders:', order);
      return false;
    }
    
    try {
      const title = typeof order.title === 'string' ? order.title : '';
      const description = typeof order.description === 'string' ? order.description : '';
      const status = typeof order.status === 'string' ? order.status : '';
      
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             getStatusText(status).toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      console.error('Error in filterOrders:', error, 'Order:', order);
      return false;
    }
  };

     // Use pagination hook for orders
   const {
    currentItems: currentOrders,
    totalPages: ordersTotalPages,
    currentPage: ordersCurrentPage,
    setCurrentPage: setOrdersCurrentPage,
    totalItems: ordersTotalItems
  } = usePagination({
    data: Array.isArray(orders) ? orders : [],
    itemsPerPage: 5,
    searchTerm,
    filterFunction: filterOrders
  });

  const handleDeleteOrder = async (order: Order) => {
    setDeleteDialogOpen(false);
    if (!order || typeof order !== 'object' || !order.id) {
      console.warn('Invalid order in handleDeleteOrder:', order);
      return;
    }
    try {
      // First, try to refund the order to wallet if it has a price
      if (order.price && typeof order.price === 'number' && order.price > 0) {
        try {
          await WalletService.refundOrder(order.id);
          toast({
            title: 'بازپرداخت موفق',
            description: `${WalletService.formatAmount(order.price)} به کیف پول شما بازپرداخت شد`,
          });
        } catch (refundError) {
          console.error('Error refunding order:', refundError);
          // Continue with deletion even if refund fails
        }
      }

      // Delete the order
      await apiClient.deleteOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
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

      <div className="container mx-auto px-4 pt-32 pb-10">
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
                <div className="text-2xl font-bold">{Array.isArray(orders) ? orders.length : 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سفارشات فعال</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(orders) ? orders.filter(order => 
                    order && 
                    typeof order === 'object' && 
                    order.status && 
                    (order.status === 'pending' || order.status === 'in_progress')
                  ).length : 0}
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
                  {formatPrice(Array.isArray(orders) ? orders.reduce((sum, order) => 
                    sum + (order && typeof order === 'object' && typeof order.price === 'number' ? order.price : 0), 0
                  ) : 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">سفارشات من</TabsTrigger>
              <TabsTrigger value="wallet">کیف پول</TabsTrigger>
              <TabsTrigger value="invoices">فاکتورها</TabsTrigger>
              <TabsTrigger value="receipts">رسیدها</TabsTrigger>
              <TabsTrigger value="profile">اطلاعات حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold">سفارشات من</h2>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="جستجو در سفارشات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button asChild className="flex items-center gap-2">
                    <a href="/wizard">
                      <Plus className="w-4 h-4" />
                      سفارش جدید
                    </a>
                  </Button>
                </div>
              </div>

              {ordersLoading ? (
                <div className="space-y-6">
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
              ) : !Array.isArray(orders) || orders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">سفارشی موجود نیست</h3>
                      <p className="text-muted-foreground mb-4">
                        شما هنوز هیچ سفارشی ندارید. اولین سفارش خود را ایجاد کنید
                      </p>
                      <Button asChild>
                        <a href="/wizard">
                          <Plus className="w-4 h-4 ml-2" />
                          سفارش جدید
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : !Array.isArray(currentOrders) || currentOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">هیچ سفارشی یافت نشد</h3>
                      <p className="text-muted-foreground mb-4">
                        سفارشی با عبارت جستجوی "{searchTerm}" پیدا نشد
                      </p>
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        حذف فیلتر
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6">
                    {Array.isArray(currentOrders) ? currentOrders.map((order) => {
                      if (!order || typeof order !== 'object' || !order.id) {
                        console.warn('Invalid order in currentOrders map:', order);
                        return null;
                      }
                      return (
                        <Card key={order.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{order.title || 'عنوان نامشخص'}</CardTitle>
                                <div className="mt-3">{renderDesignPreview(order)}</div>
                              </div>
                              <div className="flex gap-2 items-center">
                                <OrderDesignPreview
                                  orderId={order.id}
                                  orderTitle={order.title || 'عنوان نامشخص'}
                                  orderPrice={order.price || 0}
                                  paymentStatus={order.payment_status || 'pending'}
                                  onStatusUpdate={fetchOrders}
                                />
                                <Badge className={`${getStatusColor(order.status)} border-0`}>
                                  {getStatusText(order.status)}
                                </Badge>
                                {order.status === 'pending' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => { 
                                      if (order && typeof order === 'object' && order.id) {
                                        setOrderToDelete(order); 
                                        setDeleteDialogOpen(true); 
                                      } else {
                                        console.warn('Invalid order in delete button click:', order);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    حذف سفارش
                                  </Button>
                                )}
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
                      );
                    }) : null}
                  </div>
                  
                  <PaginationControls
                    currentPage={ordersCurrentPage}
                    totalPages={ordersTotalPages}
                    onPageChange={setOrdersCurrentPage}
                    totalItems={ordersTotalItems}
                    itemsPerPage={5}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">کیف پول</h2>
              </div>
              {authLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">در حال بارگیری اطلاعات احراز هویت...</p>
                  </CardContent>
                </Card>
                             ) : user?.id ? (
                 <WalletCard userId={user.id} />
               ) : (
                 <Card>
                   <CardContent className="text-center py-8">
                     <p className="text-muted-foreground">خطا در بارگیری اطلاعات کاربر</p>
                     <p className="text-sm text-muted-foreground mt-2">لطفاً دوباره وارد شوید</p>
                   </CardContent>
                 </Card>
               )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">فاکتورها</h2>
              </div>
              <InvoiceList />
            </TabsContent>

            <TabsContent value="receipts" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">رسیدها</h2>
              </div>
              <ReceiptList />
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف سفارش</DialogTitle>
            <DialogDescription>
              آیا از حذف این سفارش اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}>
              حذف سفارش
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Verification Prompt */}
      {showVerificationPrompt && user && (
        <EmailVerificationPrompt
          userEmail={user.email}
          onClose={() => setShowVerificationPrompt(false)}
          onVerified={() => {
            setShowVerificationPrompt(false);
            // Refresh user data to update email verification status
            fetchData();
            toast({ title: "تایید موفقیت‌آمیز", description: "ایمیل شما تایید شد" });
          }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;