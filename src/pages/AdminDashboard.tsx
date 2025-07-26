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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Package, Search, Trash2, Edit, Shield, Settings, Eye, Download, FileText, Filter, Layers } from 'lucide-react';
import Layout from '@/components/ui/Layout';
import { useToast } from '@/hooks/use-toast';
import { useSiteMode, type SiteMode } from '@/hooks/useSiteMode';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';

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
  user_id: string;
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

interface WireframeElement {
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: any;
}
interface WireframePage {
  name: string;
  elements: WireframeElement[];
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const { mode, updateSiteMode } = useSiteMode();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderDesigns, setSelectedOrderDesigns] = useState<Order | null>(null);
  const [selectedOrderFiles, setSelectedOrderFiles] = useState<Order | null>(null);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [wireframes, setWireframes] = useState<any[]>([]);
  const [storageFiles, setStorageFiles] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchUsers(), fetchOrders()]);
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

  const fetchUsers = async () => {
    setUsersLoading(true);
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
    } catch (error) {
      throw error;
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles to combine with orders
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

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
      throw error;
    } finally {
      setOrdersLoading(false);
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

      await fetchUsers(); // Refresh users only

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

      await fetchUsers(); // Refresh users only

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

  const formatOrderDescription = (description: string) => {
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
                {parsedData.modules.map((module: string, index: number) => (
                  <span key={index} className="bg-muted px-2 py-1 rounded text-xs">
                    {module}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      // Fallback to original description if not JSON
      return <span className="text-sm text-muted-foreground">{description}</span>;
    }
  };

  const renderWireframePreview = (wireframeData: { pages?: WireframePage[] }) => {
    if (!wireframeData?.pages) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        {wireframeData.pages.slice(0, 4).map((page: WireframePage, index: number) => (
          <div
            key={index}
            className="border rounded-lg p-2 bg-background min-h-[80px] relative overflow-hidden"
          >
            <div className="text-xs font-medium mb-1 truncate">{page.name}</div>
            <div className="absolute inset-2 top-6 border border-dashed border-muted-foreground/30 rounded">
              {page.elements?.slice(0, 3).map((element: WireframeElement, elemIndex: number) => (
                <div
                  key={elemIndex}
                  className="absolute bg-primary/20 rounded-sm"
                  style={{
                    left: `${Math.min(element.x / 10, 60)}%`,
                    top: `${Math.min(element.y / 10, 60)}%`,
                    width: `${Math.min(element.width / 15, 30)}%`,
                    height: `${Math.min(element.height / 20, 20)}%`,
                  }}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {page.elements?.length || 0} عنصر
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderModuleLayoutPreview = (parsedData: any) => {
    const modules = parsedData.moduleLayout || parsedData.modules;
    if (!modules || !Array.isArray(modules)) return null;
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="text-sm font-medium mb-2">پیش‌نمایش ساختار سایت</div>
        <div className="flex flex-wrap gap-2">
          {modules.map((mod: any, idx: number) => (
            <div
              key={mod.id || idx}
              className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 rounded px-4 py-2 min-w-[80px]"
            >
              <span className="font-bold text-xs">{mod.name}</span>
              <span className="text-[10px] text-muted-foreground">{mod.nameEn}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOrderWireframePreview = (order: Order) => {
    try {
      const parsedData = JSON.parse(order.description);
      if ((parsedData.moduleLayout && Array.isArray(parsedData.moduleLayout)) || (parsedData.modules && Array.isArray(parsedData.modules))) {
        return (
          <div className="space-y-4">
            {renderModuleLayoutPreview(parsedData)}
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {/* Visual wireframe preview if available */}
          {parsedData.pages && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">پیش‌نمایش وایرفریم</span>
              </div>
              {renderWireframePreview(parsedData)}
              {parsedData.pages.length > 4 && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  و {parsedData.pages.length - 4} صفحه دیگر...
                </div>
              )}
            </div>
          )}
          {/* Fallback to summary/mockup if no pages */}
          {!parsedData.pages && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">پیکربندی پروژه</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="bg-background rounded p-2">
                  <div className="text-xs text-muted-foreground">نوع سایت</div>
                  <div className="font-medium">{parsedData.siteType === 'personal' ? 'شخصی' : 'تجاری'}</div>
                </div>
                <div className="bg-background rounded p-2">
                  <div className="text-xs text-muted-foreground">دامنه</div>
                  <div className="font-medium truncate">{parsedData.userInfo?.domain || 'نامشخص'}</div>
                </div>
                <div className="bg-background rounded p-2">
                  <div className="text-xs text-muted-foreground">تعداد ماژول</div>
                  <div className="font-medium">{parsedData.modules?.length || 0}</div>
                </div>
                <div className="bg-background rounded p-2">
                  <div className="text-xs text-muted-foreground">لوگو</div>
                  <div className="font-medium">{parsedData.branding?.logo ? 'دارد' : 'ندارد'}</div>
                </div>
              </div>
              {parsedData.modules && parsedData.modules.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">ماژول‌های انتخاب شده:</div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.modules.map((module: string, index: number) => (
                      <div key={index} className="bg-primary/10 border border-primary/20 rounded px-3 py-1 text-xs">
                        {module}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">ساختار کلی سایت:</div>
                <div className="border rounded bg-background p-4 h-32 relative overflow-hidden">
                  <div className="absolute top-2 left-2 right-2 h-4 bg-primary/20 rounded-sm flex items-center px-2">
                    <div className="w-2 h-2 bg-primary/40 rounded-full mr-1"></div>
                    <div className="text-xs opacity-60">Header</div>
                  </div>
                  <div className="absolute top-8 left-2 right-2 bottom-6 bg-muted/50 rounded-sm p-2">
                    <div className="grid grid-cols-3 gap-1 h-full">
                      {parsedData.modules?.slice(0, 6).map((module: string, index: number) => (
                        <div
                          key={index}
                          className="bg-primary/10 rounded-sm border border-primary/20 flex items-center justify-center"
                        >
                          <div className="text-xs text-center opacity-70">
                            {module.slice(0, 8)}
                          </div>
                        </div>
                      ))}
                      {parsedData.modules?.length > 6 && (
                        <div className="bg-muted rounded-sm border border-border flex items-center justify-center">
                          <div className="text-xs opacity-60">+{parsedData.modules.length - 6}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 bg-muted rounded-sm"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      // Fallback to original description if not JSON
      return (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">توضیحات سفارش</span>
          </div>
          <p className="text-sm text-muted-foreground">{order.description}</p>
        </div>
      );
    }
  };

  // Filter functions for pagination
  const filterOrders = (order: Order, searchTerm: string) => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  };

  const filterUsers = (profile: Profile, searchTerm: string) => {
    return profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           profile.email.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Pagination hooks
  const {
    currentItems: currentOrders,
    totalPages: ordersTotalPages,
    currentPage: ordersCurrentPage,
    setCurrentPage: setOrdersCurrentPage,
    totalItems: ordersTotalItems
  } = usePagination({
    data: orders,
    itemsPerPage: 6,
    searchTerm,
    filterFunction: filterOrders
  });

  const {
    currentItems: currentUsers,
    totalPages: usersTotalPages,
    currentPage: usersCurrentPage,
    setCurrentPage: setUsersCurrentPage,
    totalItems: usersTotalItems
  } = usePagination({
    data: profiles,
    itemsPerPage: 8,
    searchTerm: userSearchTerm,
    filterFunction: filterUsers
  });

  const viewOrderDesigns = async (orderId: string) => {
    try {
      // Get the order to find the user_id
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Fetch wireframes for this user
      const { data: wireframeData, error } = await supabase
        .from('wireframes')
        .select('*')
        .eq('user_id', order.user_id);

      if (error) throw error;

      setWireframes(wireframeData || []);
      setSelectedOrderDesigns(order);
      setDesignDialogOpen(true);

      toast({
        title: 'طرح‌های کاربر بارگیری شد',
        description: `${wireframeData?.length || 0} طرح یافت شد`,
      });
    } catch (error) {
      console.error('Error fetching designs:', error);
      toast({
        title: 'خطا در بارگیری طرح‌ها',
        description: 'مشکلی در دریافت طرح‌های کاربر پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const viewOrderFiles = async (orderId: string) => {
    try {
      // Get the order to find the user_id
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Fetch files from wireframe-assets bucket for this user
      const { data: filesData, error } = await supabase.storage
        .from('wireframe-assets')
        .list(order.user_id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      setStorageFiles(filesData || []);
      setSelectedOrderFiles(order);
      setFilesDialogOpen(true);

      toast({
        title: 'فایل‌های کاربر بارگیری شد',
        description: `${filesData?.length || 0} فایل یافت شد`,
      });
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'خطا در بارگیری فایل‌ها',
        description: 'مشکلی در دریافت فایل‌های کاربر پیش آمد',
        variant: 'destructive',
      });
    }
  };

  const downloadFile = async (fileName: string, userId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('wireframe-assets')
        .download(`${userId}/${fileName}`);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'فایل دانلود شد',
        description: `فایل ${fileName} با موفقیت دانلود شد`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'خطا در دانلود',
        description: 'مشکلی در دانلود فایل پیش آمد',
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

              {ordersLoading ? (
                <div className="space-y-6">
                  {[...Array(6)].map((_, i) => (
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
                      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">هیچ سفارشی یافت نشد</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? `سفارشی با عبارت "${searchTerm}" پیدا نشد` : 'هیچ سفارشی در سیستم ثبت نشده است'}
                      </p>
                      {searchTerm && (
                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                          حذف فیلتر
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6">
                    {currentOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <CardTitle className="text-lg">{order.title}</CardTitle>
                           <div className="mt-3">
                             {renderOrderWireframePreview(order)}
                           </div>
                           <p className="text-sm text-muted-foreground mt-2">
                             مشتری: {order.profiles?.full_name} ({order.profiles?.email})
                           </p>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewOrderDesigns(order.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              مشاهده طرح‌ها
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewOrderFiles(order.id)}
                              className="flex items-center gap-1"
                            >
                              <Package className="w-3 h-3" />
                              فایل‌های کاربر
                            </Button>
                          </div>
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
                  
                  <PaginationControls
                    currentPage={ordersCurrentPage}
                    totalPages={ordersTotalPages}
                    onPageChange={setOrdersCurrentPage}
                    totalItems={ordersTotalItems}
                    itemsPerPage={6}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-2xl font-bold">مدیریت کاربران</h2>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو در کاربران..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
              </div>

                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-1/3" />
                              <Skeleton className="h-4 w-1/2 mt-2" />
                              <Skeleton className="h-3 w-1/4 mt-1" />
                            </div>
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-20" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : currentUsers.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">هیچ کاربری یافت نشد</h3>
                        <p className="text-muted-foreground mb-4">
                          {userSearchTerm ? `کاربری با عبارت "${userSearchTerm}" پیدا نشد` : 'هیچ کاربری در سیستم ثبت نشده است'}
                        </p>
                        {userSearchTerm && (
                          <Button variant="outline" onClick={() => setUserSearchTerm('')}>
                            حذف فیلتر
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {currentUsers.map((profile) => (
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
                    
                    <PaginationControls
                      currentPage={usersCurrentPage}
                      totalPages={usersTotalPages}
                      onPageChange={setUsersCurrentPage}
                      totalItems={usersTotalItems}
                      itemsPerPage={8}
                    />
                  </div>
                )}
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

      {/* Design Preview Dialog */}
      <Dialog open={designDialogOpen} onOpenChange={setDesignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>طرح‌های {selectedOrderDesigns?.profiles?.full_name}</DialogTitle>
            <DialogDescription>
              مشاهده تمام طرح‌های ذخیره شده توسط کاربر
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {wireframes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">هیچ طرحی یافت نشد</p>
              </div>
            ) : (
              wireframes.map((wireframe) => (
                <Card key={wireframe.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{wireframe.name}</CardTitle>
                        {wireframe.description && (
                          <CardDescription className="mt-1">
                            {wireframe.description}
                          </CardDescription>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          تاریخ ایجاد: {formatDate(wireframe.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">پیش‌نمایش طرح:</p>
                      <div className="text-xs text-muted-foreground mb-3">
                        صفحات: {wireframe.data?.pages?.length || 0} | 
                        عناصر: {wireframe.data?.pages?.reduce((total: number, page: any) => total + (page.elements?.length || 0), 0) || 0}
                      </div>
                      
                      {/* Visual wireframe preview */}
                      {wireframe.data?.pages && wireframe.data.pages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {wireframe.data.pages.slice(0, 4).map((page: any, index: number) => (
                            <div
                              key={index}
                              className="border rounded-lg p-2 bg-background min-h-[80px] relative overflow-hidden"
                            >
                              <div className="text-xs font-medium mb-1 truncate">{page.name}</div>
                              <div className="absolute inset-2 top-6 border border-dashed border-muted-foreground/30 rounded">
                                {page.elements?.slice(0, 3).map((element: any, elemIndex: number) => (
                                  <div
                                    key={elemIndex}
                                    className="absolute bg-primary/20 rounded-sm"
                                    style={{
                                      left: `${Math.min(element.x / 10, 60)}%`,
                                      top: `${Math.min(element.y / 10, 60)}%`,
                                      width: `${Math.min(element.width / 15, 30)}%`,
                                      height: `${Math.min(element.height / 20, 20)}%`,
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {page.elements?.length || 0} عنصر
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          هیچ صفحه‌ای یافت نشد
                        </div>
                      )}
                      
                      {wireframe.data?.pages && wireframe.data.pages.length > 4 && (
                        <div className="mt-3 text-xs text-muted-foreground text-center">
                          و {wireframe.data.pages.length - 4} صفحه دیگر...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>فایل‌های {selectedOrderFiles?.profiles?.full_name}</DialogTitle>
            <DialogDescription>
              مشاهده و دانلود فایل‌های آپلود شده توسط کاربر
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {storageFiles.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">هیچ فایلی یافت نشد</p>
              </div>
            ) : (
              storageFiles.map((file) => (
                <Card key={file.name} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          حجم: {Math.round(file.metadata?.size / 1024)} KB | 
                          آخرین تغییر: {formatDate(file.updated_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.name, selectedOrderFiles?.user_id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      دانلود
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard;