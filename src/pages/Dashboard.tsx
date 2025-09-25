import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/ui/Layout';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { EmailVerificationPrompt } from '@/components/EmailVerificationPrompt';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnimatedLoader } from '@/components/ui/AnimatedLoader';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { Plus, Package, User, Calendar, DollarSign, Search, Trash2, Palette } from 'lucide-react';

// Dashboard components
import CreateOrderDialog from '@/components/dashboard/CreateOrderDialog';
import EditProfileDialog from '@/components/dashboard/EditProfileDialog';
import WalletCard from '@/components/dashboard/WalletCard';
import InvoiceList from '@/components/dashboard/InvoiceList';
import ReceiptList from '@/components/dashboard/ReceiptList';
import DesignPreview from '@/components/wizard/DesignPreview';
import OrderCard from '@/components/dashboard/OrderCard';

// Services layer
import { authService, ordersService, invoiceService, receiptService, paymentService, type Order, type UserProfile } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';
import { localOrders, type LocalOrder } from '@/lib/localOrders';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState<number>(0);
  const [receiptCount, setReceiptCount] = useState<number>(0);
  const [draftOrders, setDraftOrders] = useState<LocalOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // If login payload ensures emailVerified true, we don't need to show verification prompt.
    setShowVerificationPrompt(false);
    // Reset avatar error on user change
    setAvatarError(false);
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Ensure we have an access token before making authenticated calls
    let token = tokenManager.getAccessToken();
    if (!token) {
      tokenManager.forceRefreshFromStorage();
      token = tokenManager.getAccessToken();
      if (!token) {
        // Token not yet available (race after login); skip this cycle quietly
        setLoading(false);
        return;
      }
    }

    try {
      // Profile: merge /auth/me and /profiles/me for richer info
      const me = await authService.getMe();
      let merged: any = me;
      try {
        const pr = await authService.getProfile();
        if (pr?.success && pr.data) {
          merged = { ...me, ...pr.data };
          const avatarFromProfile = (pr.data as any).avatarUrl || (pr.data as any).avatar_url || (pr.data as any).avatar;
          if (!merged.avatarUrl && avatarFromProfile) {
            (merged as any).avatarUrl = avatarFromProfile;
          }
        }
      } catch {}
      setProfile(merged as any);

      // Orders
      await fetchOrders();

      // Invoices count (best effort)
      try {
        const invoices = await invoiceService.getInvoices({ limit: 100 });
        const count = Array.isArray(invoices)
          ? invoices.length
          : (Array.isArray((invoices as any)?.items) ? (invoices as any).items.length : 0);
        setInvoiceCount(count);
      } catch (error) {
        console.warn('Failed to fetch invoice count:', error);
        setInvoiceCount(0);
      }

      // Receipts count (best effort)
      try {
        const receipts = await receiptService.getReceipts({ limit: 100 });
        const arr = Array.isArray(receipts)
          ? receipts
          : (Array.isArray((receipts as any)?.items) ? (receipts as any).items : (Array.isArray((receipts as any)?.receipts) ? (receipts as any).receipts : []));
        setReceiptCount(arr.length);
      } catch (error) {
        console.warn('Failed to fetch receipt count:', error);
        setReceiptCount(0);
      }

      setDraftOrders(localOrders.list());
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
      // Swallow initial unauthorized errors after login; a subsequent cycle will succeed once token is ready
      if (msg.includes('unauthorized')) {
        console.warn('Dashboard: Skipping unauthorized fetch cycle, will retry later');
      } else {
        console.error('Error fetching data:', error);
        toast({
          title: 'خطا در بارگیری اطلاعات',
          description: 'مشکلی در دریافت اطلاعات پیش آمد',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const ordersData = await ordersService.getOrders({ mine: true, status: statusFilter !== 'all' ? statusFilter : undefined, from: fromDate || undefined, to: toDate || undefined });
      const list = Array.isArray((ordersData as any)?.orders)
        ? (ordersData as any).orders
        : Array.isArray((ordersData as any)?.items)
          ? (ordersData as any).items
          : (Array.isArray(ordersData) ? ordersData : []);
      const validOrders = (list as any[]).filter((order: any) => order && typeof order === 'object' && typeof order.id === 'string');
      setOrders(validOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'خطا در بارگیری سفارشات', description: 'مشکلی در دریافت سفارشات پیش آمد', variant: 'destructive' });
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const renderModuleLayoutPreview = (parsedData: any) => {
    if (!parsedData || typeof parsedData !== 'object') return null;
    const modules = parsedData.moduleLayout || parsedData.modules;
    if (!Array.isArray(modules)) return null;
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="text-sm font-medium mb-2">پیش‌نمایش ساختار سایت</div>
        <div className="flex flex-wrap gap-2">
          {modules.map((mod: any, idx: number) => (
            <div key={mod?.id || idx} className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 rounded px-4 py-2 min-w-[80px]">
              <span className="font-bold text-xs">{mod?.name || 'نامشخص'}</span>
              <span className="text-[10px] text-muted-foreground">{mod?.nameEn || 'Unknown'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDesignPreview = (order: Order) => {
    // Prefer wizardData from backend if present
    try {
      const wizardPayload: any = (order as any).wizardData || (order as any).wizard_data;
      if (wizardPayload?.websiteFramework?.dynamicDesign) {
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">پیش‌نمایش طراحی پویا</span>
              </div>
<DesignPreview design={wizardPayload.websiteFramework.dynamicDesign} showActions={false} uploadedImages={wizardPayload.websiteFramework.uploadedImages || {}} />
            </div>
          </div>
        );
      }
    } catch {}

    // Fallback: try to parse JSON description
    if (order?.description) {
      try {
        const parsedData = JSON.parse(order.description);
        if (parsedData?.websiteFramework?.dynamicDesign) {
          return (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">پیش‌نمایش طراحی پویا</span>
                </div>
                <DesignPreview design={parsedData.websiteFramework.dynamicDesign} showActions={false} />
              </div>
            </div>
          );
        }
        if (parsedData?.moduleLayout || parsedData?.modules) {
          return <div className="space-y-4">{renderModuleLayoutPreview(parsedData)}</div>;
        }
      } catch {}

      // If description exists but not JSON
      return (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">توضیحات سفارش</span>
          </div>
          <p className="text-sm text-muted-foreground">{order.description}</p>
        </div>
      );
    }

    // No description and no wizard data
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">توضیحات سفارش</span>
        </div>
        <p className="text-sm text-muted-foreground">توضیحات نامشخص</p>
      </div>
    );
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
    try { return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'; } catch { return '0 تومان'; }
  };
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : 'نامشخص');

  const filterOrders = (order: Order, searchTerm: string) => {
    if (!order || !searchTerm) return true;
    const title = order.title || '';
    const description = order.description || '';
    const status = order.status || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStatusText(status).toLowerCase().includes(searchTerm.toLowerCase());
  };

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
    if (!order?.id) return;
    try {
      try { await (await import('@/lib/services')).walletService.refundOrder(order.id); } catch {}
      await ordersService.deleteOrder(order.id);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      toast({ title: 'سفارش حذف شد', description: 'سفارش با موفقیت حذف شد' });
    } catch {
      toast({ title: 'خطا در حذف سفارش', description: 'مشکلی در حذف سفارش پیش آمد', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AnimatedLoader size="lg" />
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">خوش آمدید، {profile?.fullName || user?.email}</h1>
            <p className="text-muted-foreground">از این صفحه می‌توانید سفارشات و اطلاعات حساب خود را مدیریت کنید</p>
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
                  {Array.isArray(orders) ? orders.filter(o => o && (o.status === 'pending' || o.status === 'in_progress')).length : 0}
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
                  {formatPrice(Array.isArray(orders) ? orders.reduce((sum, o) => sum + (o?.price || 0), 0) : 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">سفارشات من</TabsTrigger>
              <TabsTrigger value="wallet">کیف پول</TabsTrigger>
              <TabsTrigger value="invoices">فاکتورها {invoiceCount > 0 ? `(${invoiceCount})` : ''}</TabsTrigger>
              <TabsTrigger value="receipts">رسیدها {receiptCount > 0 ? `(${receiptCount})` : ''}</TabsTrigger>
              <TabsTrigger value="profile">اطلاعات حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold">سفارشات من</h2>
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="جستجو دامنه/عنوان..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-64" />
                  </div>
                  <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="pending">در انتظار</option>
                    <option value="in_progress">در حال انجام</option>
                    <option value="completed">تکمیل شده</option>
                    <option value="cancelled">لغو شده</option>
                  </select>
                  <input type="date" className="border rounded px-2 py-1 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  <input type="date" className="border rounded px-2 py-1 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="جستجو در سفارشات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-64" />
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
                    </Card>
                  ))}
                </div>
              ) : !Array.isArray(orders) || orders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">سفارشی موجود نیست</h3>
                      <p className="text-muted-foreground mb-4">شما هنوز هیچ سفارشی ندارید. اولین سفارش خود را ایجاد کنید</p>
                      <Button asChild>
                        <a href="/wizard">
                          <Plus className="w-4 h-4 ml-2" />
                          سفارش جدید
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6">
                    {Array.isArray(draftOrders) && draftOrders.length > 0 && draftOrders.map((d) => (
                      <Card key={d.id} className="border-dashed">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{d.payload.title}</CardTitle>
                              <div className="mt-3">
                                <div className="border rounded-lg p-4 bg-muted/30">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">توضیحات سفارش</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{d.payload.description}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Badge className="bg-orange-100 text-orange-800 border-0">پیش‌نویس</Badge>
                              <Button size="sm" onClick={async () => {
                                try {
                                  const real = await ordersService.createOrder({
                                    title: d.payload.title,
                                    description: d.payload.description,
                                    price: d.payload.price,
                                    comments: d.payload.comments,
                                    totalPages: d.payload.total_pages,
                                    totalSections: d.payload.total_sections,
                                    siteType: d.payload.siteType,
                                    sessionId: d.payload.sessionId,
                                    wizardData: d.payload.wizardData,
                                  } as any);
                                  localOrders.remove(d.id);
                                  setDraftOrders(prev => prev.filter(x => x.id !== d.id));
                                  const pr = await paymentService.requestPayment({
                                    amount: real.price || 0,
                                    description: `پرداخت سفارش ${real.id}`,
                                    orderId: real.id,
                                    callbackUrl: `${window.location.origin}/payment/callback`
                                  });
                                  if ((pr as any)?.paymentUrl) window.location.href = (pr as any).paymentUrl; else throw new Error('آدرس پرداخت نامعتبر است');
                                } catch (err: any) {
                                  toast({ title: 'خطا در ادامه سفارش پیش‌نویس', description: err?.message || 'مشکلی پیش آمد', variant: 'destructive' });
                                }
                              }}>پرداخت درگاه</Button>
                              <Button size="sm" variant="outline" onClick={() => { localOrders.remove(d.id); setDraftOrders(prev => prev.filter(x => x.id !== d.id)); }}>حذف پیش‌نویس</Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div><span className="font-medium">قیمت: </span>{formatPrice(d.payload.price)}</div>
                            <div><span className="font-medium">تاریخ ایجاد: </span>{new Date(d.created_at).toLocaleDateString('fa-IR')}</div>
                            <div><span className="font-medium">آخرین بروزرسانی: </span>{new Date(d.updated_at).toLocaleDateString('fa-IR')}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {currentOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order as any}
                        onDeleted={(id) => setOrders(prev => prev.filter(o => o.id !== id))}
                        onRefresh={fetchOrders}
                      />
                    ))}
                  </div>

                  <PaginationControls currentPage={ordersCurrentPage} totalPages={ordersTotalPages} onPageChange={setOrdersCurrentPage} totalItems={ordersTotalItems} itemsPerPage={5} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">کیف پول</h2>
              </div>
              {authLoading ? (
                <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">در حال بارگیری اطلاعات احراز هویت...</p></CardContent></Card>
              ) : (user?.id || profile?.id) ? (
                <WalletCard userId={(user?.id || profile?.id)!} />
              ) : (
                <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">در حال آماده‌سازی اطلاعات کاربر...</p><p className="text-sm text-muted-foreground mt-2">در صورت ادامه مشکل، لطفاً دوباره وارد شوید</p></CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">فاکتورها</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">وضعیت</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">در این بخش می‌توانید فاکتورها را مشاهده و پرداخت کنید.</CardContent>
                </Card>
              </div>
              <InvoiceList />
            </TabsContent>

            <TabsContent value="receipts" className="space-y-6">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">رسیدها</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">راهنما</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">رسیدهای پرداخت موفق شما در این بخش قابل دانلود هستند.</CardContent>
                </Card>
              </div>
              <ReceiptList />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">اطلاعات حساب</h2>
                <Button onClick={() => setEditProfileOpen(true)} variant="outline"><User className="w-4 h-4 ml-2" />ویرایش اطلاعات</Button>
              </div>

              {/* Profile header with avatar and badges */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {profile?.avatarUrl && !avatarError ? (
                        <img
                          src={profile.avatarUrl}
                          alt="avatar"
                          className="h-16 w-16 rounded-full border object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full border bg-muted flex items-center justify-center text-lg">
                          {(profile?.fullName?.[0] || profile?.email?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-semibold truncate">{profile?.fullName || profile?.email || 'کاربر'}</div>
                        <span className={`text-xs px-2 py-0.5 rounded ${((profile as any)?.verification_status === 'verified' || profile?.emailConfirmedAt) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {((profile as any)?.verification_status === 'verified' || profile?.emailConfirmedAt) ? 'ایمیل تایید شده' : 'ایمیل تایید نشده'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground/80">
                          {(profile as any)?.role || 'user'}
                        </span>
                        {(profile as any)?.status && (
                          <span className={`text-xs px-2 py-0.5 rounded ${((profile as any).status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}`}>
                            {(profile as any).status}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 truncate">{profile?.email}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal information */}
              <Card>
                <CardHeader><CardTitle>اطلاعات شخصی</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">نام کامل</label>
                      <p className="mt-1">{profile?.fullName || 'نامشخص'}</p>
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

              {/* Account details */}
              <Card>
                <CardHeader><CardTitle>جزئیات حساب</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">نقش: </span>{(profile as any)?.role || 'user'}</div>
                    <div><span className="text-muted-foreground">وضعیت: </span>{(profile as any)?.status || 'active'}</div>
                    <div><span className="text-muted-foreground">تاریخ ایجاد: </span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fa-IR') : '—'}</div>
                    <div><span className="text-muted-foreground">آخرین ورود: </span>{(profile as any)?.last_login_at ? new Date((profile as any).last_login_at).toLocaleDateString('fa-IR') : '—'}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <CreateOrderDialog open={createOrderOpen} onOpenChange={setCreateOrderOpen} onOrderCreated={fetchData} />
      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} profile={profile} onProfileUpdated={fetchData} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف سفارش</DialogTitle>
            <DialogDescription>آیا از حذف این سفارش اطمینان دارید؟ این عملیات غیرقابل بازگشت است.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>انصراف</Button>
            <Button variant="destructive" onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}>حذف سفارش</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showVerificationPrompt && user && (
        <EmailVerificationPrompt
          userEmail={user.email}
          onClose={() => setShowVerificationPrompt(false)}
          onVerified={() => { setShowVerificationPrompt(false); fetchData(); toast({ title: 'تایید موفقیت‌آمیز', description: 'ایمیل شما تایید شد' }); }}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
