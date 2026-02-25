import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Palette, Trash2, Edit2, CreditCard, Eye, Calendar, Layers, Globe } from 'lucide-react';
import DesignPreview from '@/components/wizard/DesignPreview';
import { ordersService, paymentService, type Order } from '@/lib/services';

interface OrderCardProps {
  order: Order & { wizardData?: any; wizard_data?: any };
  onDeleted?: (id: string) => void;
  onRefresh?: () => void;
  hidePayButton?: boolean;
  onDeleteRequest?: (id: string) => Promise<void> | void;
}

const statusText = (s: string) => {
  switch (s) {
    case 'pending': return 'در انتظار';
    case 'in_progress': return 'در حال انجام';
    case 'completed': return 'تکمیل شده';
    case 'cancelled': return 'لغو شده';
    default: return s;
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatPrice = (n: number) => new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

const OrderCard: React.FC<OrderCardProps> = ({ order, onDeleted, onRefresh, hidePayButton = false, onDeleteRequest }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const wiz: any = (order as any).wizardData || (order as any).wizard_data || {};
  const dynamic = wiz?.websiteFramework?.dynamicDesign;
  const uploadedImages = wiz?.websiteFramework?.uploadedImages || {};
  const domain = wiz?.domains?.primaryDomain || wiz?.userInfo?.domain || '';

  const handleDelete = async () => {
    try {
      if (onDeleteRequest) {
        await onDeleteRequest(order.id);
      } else {
        await ordersService.deleteOrder(order.id);
      }
      toast({ title: 'سفارش حذف شد', description: 'سفارش با موفقیت حذف شد' });
      onDeleted?.(order.id);
    } catch (err: any) {
      toast({ title: 'عدم دسترسی', description: 'حذف سفارش امکان‌پذیر نیست. ممکن است محدودیت دسترسی داشته باشید.', variant: 'destructive' });
    }
  };

  const handleEdit = () => {
    try {
      // Pass wizard payload via localStorage to avoid 403 on fetching
      if (wiz) localStorage.setItem('pendingWizardEdit', JSON.stringify(wiz));
    } catch {}
    navigate(`/wizard?mode=edit&orderId=${order.id}`);
  };

  const handlePay = async () => {
    try {
      const pr = await paymentService.requestPayment({
        amount: order.price || 0,
        description: `پرداخت سفارش ${order.id}`,
        orderId: order.id,
        callbackUrl: `${window.location.origin}/payment/callback`,
        returnUrl: `${window.location.origin}/dashboard`,
      });
      const url = (pr as any)?.paymentUrl || (pr as any)?.data?.paymentUrl;
      if (url) {
        try {
          const info = {
            orderId: order.id,
            amount: order.price || 0,
            description: `پرداخت سفارش ${order.id}`,
            timestamp: Date.now(),
          };
          sessionStorage.setItem('orderPaymentInfo', JSON.stringify(info));
        } catch {}
        window.location.href = String(url);
      } else {
        throw new Error('آدرس پرداخت نامعتبر است');
      }
    } catch (err: any) {
      toast({ title: 'خطا در ایجاد پرداخت', description: err?.message || 'مشکلی در ایجاد پرداخت پیش آمد', variant: 'destructive' });
    }
  };

  const pagesCount = Array.isArray(dynamic?.pages) ? dynamic.pages.length : 0;
  const sectionsCount = Array.isArray(dynamic?.pages)
    ? dynamic.pages.reduce((sum: number, p: any) => sum + (Array.isArray(p.sections) ? p.sections.length : 0), 0)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">{order.title || 'عنوان نامشخص'}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge className={`${statusColor(order.status)} border-0`}>{statusText(order.status)}</Badge>
              {domain && (
                <div className="flex items-center gap-1"><Globe className="w-3 h-3" />{domain}</div>
              )}
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date((order as any).created_at || (order as any).createdAt || Date.now()).toLocaleDateString('fa-IR')}</div>
              {pagesCount > 0 && (
                <div className="flex items-center gap-1"><Layers className="w-3 h-3" />{pagesCount} صفحه / {sectionsCount} بخش</div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye className="w-3 h-3" />مشاهده
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center gap-1"><Edit2 className="w-3 h-3" />ویرایش</Button>
            {order.status === 'pending' && (
              <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center gap-1"><Trash2 className="w-3 h-3" />حذف</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Preview */}
            <div className="md:col-span-2 border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">پیش‌نمایش طراحی</span>
              </div>
              {dynamic ? (
                <DesignPreview design={dynamic} showActions={false} uploadedImages={uploadedImages} />
              ) : (
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">بدون طراحی</div>
              )}
            </div>
            {/* Details */}
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-muted-foreground mb-1">مبلغ</div>
                <div className="font-bold text-xl">{formatPrice(order.price || 0)}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground mb-1">توضیحات</div>
                <div className="line-clamp-5 whitespace-pre-wrap">{order.comments || order.description || '—'}</div>
              </div>
              {!hidePayButton && order.status === 'pending' && (
                <Button onClick={handlePay} className="w-full flex items-center gap-2"><CreditCard className="w-4 h-4" />پرداخت درگاه</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderCard;