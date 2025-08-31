import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Palette, 
  Code, 
  Upload, 
  Eye,
  Download,
  MessageCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { enhancedApiClient, EnhancedOrderData } from '@/lib/enhancedApiClient';

interface OrderProgressTrackerProps {
  orderId: string;
  className?: string;
  onStatusUpdate?: (status: string) => void;
}

interface ProgressStep {
  step: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
  estimatedDuration: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const OrderProgressTracker: React.FC<OrderProgressTrackerProps> = ({
  orderId,
  className = '',
  onStatusUpdate
}) => {
  const [orderData, setOrderData] = useState<EnhancedOrderData | null>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderProgress();
  }, [orderId]);

  const fetchOrderProgress = async () => {
    try {
      setLoading(true);
      const [orderResponse, progressResponse] = await Promise.all([
        enhancedApiClient.getEnhancedOrder(orderId),
        enhancedApiClient.getOrderProgress(orderId)
      ]);
      
      setOrderData(orderResponse);
      setProgressData(progressResponse);
      
      if (onStatusUpdate) {
        onStatusUpdate(orderResponse.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات پیشرفت سفارش');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: string): React.ReactNode => {
    switch (step) {
      case 'order_created':
        return <FileText className="w-5 h-5" />;
      case 'payment_verified':
        return <CheckCircle className="w-5 h-5" />;
      case 'design_started':
        return <Palette className="w-5 h-5" />;
      case 'development_started':
        return <Code className="w-5 h-5" />;
      case 'content_upload':
        return <Upload className="w-5 h-5" />;
      case 'testing':
        return <Eye className="w-5 h-5" />;
      case 'client_review':
        return <MessageCircle className="w-5 h-5" />;
      case 'final_revisions':
        return <CheckCircle className="w-5 h-5" />;
      case 'deployment':
        return <Upload className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStepColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-gray-500 bg-gray-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getStepStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'تکمیل شده';
      case 'in_progress':
        return 'در حال انجام';
      case 'pending':
        return 'در انتظار';
      default:
        return 'نامشخص';
    }
  };

  const getStepTitle = (step: string): string => {
    switch (step) {
      case 'order_created':
        return 'ثبت سفارش';
      case 'payment_verified':
        return 'تأیید پرداخت';
      case 'design_started':
        return 'شروع طراحی';
      case 'development_started':
        return 'شروع توسعه';
      case 'content_upload':
        return 'آپلود محتوا';
      case 'testing':
        return 'تست و بررسی';
      case 'client_review':
        return 'بازبینی مشتری';
      case 'final_revisions':
        return 'بازبینی نهایی';
      case 'deployment':
        return 'راه‌اندازی';
      case 'completed':
        return 'تکمیل پروژه';
      default:
        return step;
    }
  };

  const getStepDescription = (step: string): string => {
    switch (step) {
      case 'order_created':
        return 'سفارش شما با موفقیت ثبت شده و در صف پردازش قرار گرفته است';
      case 'payment_verified':
        return 'پرداخت شما تأیید شده و پروژه آماده شروع کار است';
      case 'design_started':
        return 'تیم طراحی شروع به کار بر روی طرح اولیه وب‌سایت کرده است';
      case 'development_started':
        return 'توسعه وب‌سایت بر اساس طرح تأیید شده آغاز شده است';
      case 'content_upload':
        return 'در حال آپلود و تنظیم محتوای وب‌سایت هستیم';
      case 'testing':
        return 'وب‌سایت در حال تست و بررسی کیفیت است';
      case 'client_review':
        return 'نسخه اولیه برای بررسی شما آماده شده است';
      case 'final_revisions':
        return 'در حال اعمال تغییرات و بازبینی‌های نهایی هستیم';
      case 'deployment':
        return 'وب‌سایت در حال راه‌اندازی و فعال‌سازی است';
      case 'completed':
        return 'پروژه با موفقیت تکمیل شده و آماده استفاده است';
      default:
        return 'مرحله در حال پردازش';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>پیشرفت سفارش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>پیشرفت سفارش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchOrderProgress} variant="outline">
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orderData || !progressData) {
    return (
      <Card className={className}>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            اطلاعات سفارش یافت نشد
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressSteps: ProgressStep[] = progressData.timeline || [];
  const currentStepIndex = progressSteps.findIndex(step => step.status === 'in_progress');
  const progressPercentage = progressData.progressPercentage || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          پیشرفت سفارش
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
              <div className="text-sm text-muted-foreground">پیشرفت کلی</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{progressData.currentStep || 'نامشخص'}</div>
              <div className="text-xs text-muted-foreground">مرحله فعلی</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{progressData.estimatedDelivery || 'نامشخص'}</div>
              <div className="text-xs text-muted-foreground">تاریخ تحویل تخمینی</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{orderData.status}</div>
              <div className="text-xs text-muted-foreground">وضعیت سفارش</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>پیشرفت کلی</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Progress Timeline */}
        <div className="space-y-4">
          <h4 className="font-semibold">مراحل پیشرفت</h4>
          <div className="space-y-3">
            {progressSteps.map((step, index) => (
              <div
                key={step.step}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  step.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : step.status === 'in_progress'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Step Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(step.status)}`}>
                  {getStepIcon(step.step)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium">{getStepTitle(step.step)}</h5>
                    <Badge variant="outline" className={getStepColor(step.status)}>
                      {getStepStatusText(step.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {getStepDescription(step.step)}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {step.completedAt && (
                      <span>تکمیل: {new Date(step.completedAt).toLocaleDateString('fa-IR')}</span>
                    )}
                    <span>مدت تخمینی: {step.estimatedDuration}</span>
                  </div>
                </div>

                {/* Step Status Indicator */}
                <div className="flex flex-col items-center gap-2">
                  {step.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {step.status === 'in_progress' && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  )}
                  {step.status === 'pending' && (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                  
                  {/* Progress Line */}
                  {index < progressSteps.length - 1 && (
                    <div className={`w-0.5 h-8 ${
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Milestone */}
        {progressData.nextMilestone && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">مرحله بعدی</span>
            </div>
            <p className="text-sm text-blue-700">{progressData.nextMilestone}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrderProgress}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            بروزرسانی
          </Button>
          
          {orderData.payment_status === 'succeeded' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              تماس با پشتیبانی
            </Button>
          )}
          
          {progressData.currentStep === 'client_review' && (
            <Button
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              مشاهده پیش‌نمایش
            </Button>
          )}
        </div>

        {/* Last Update */}
        <div className="text-center text-xs text-muted-foreground">
          آخرین بروزرسانی: {progressData.lastUpdate ? new Date(progressData.lastUpdate).toLocaleString('fa-IR') : 'نامشخص'}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderProgressTracker;











