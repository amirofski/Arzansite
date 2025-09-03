import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  User, 
  Globe, 
  Palette, 
  Layers, 
  CreditCard, 
  Loader2, 
  Calculator,
  AlertCircle,
  LogIn,
  Shield,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { WizardOrderManager } from './WizardOrderManager';

interface OrderSubmissionStepProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

interface WizardData {
  siteType: 'personal' | 'business' | '';
  modules: Array<{
    id: string;
    name: string;
    nameEn: string;
    complexity: number;
    customizations: {
      layout: string;
      colors: string;
      animations: string;
    };
  }>;
  websiteFramework?: {
    dynamicDesign?: {
      pages?: Array<{
        id: string;
        name: string;
        sections: Array<{
          id: string;
          sectionType: string;
          layoutId: string;
          order: number;
          customData?: Record<string, unknown>;
        }>;
        canvasDimensions: {
          width: number;
          height: number;
        };
      }>;
      currentPageId: string;
    };
  };
  branding?: {
    primaryColor?: string;
    fontFamily?: string;
    logo?: string;
  };
  pricing?: {
    additionalServices?: Record<string, boolean>;
    customizationLevel?: number[];
    rushDelivery?: boolean;
    totalPrice?: number;
  };
  paymentCycle?: 'monthly' | 'annual';
  autoRenewal?: boolean;
  userInfo?: {
    domain?: string;
    name?: string;
    email?: string;
    additionalDomains?: Array<{
      domain: string;
      extension: string;
      price: number;
      available: boolean;
    }>;
  };
}

const OrderSubmissionStep = ({ data: wizardData, updateData }: OrderSubmissionStepProps) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Check authentication status when component mounts
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated, authLoading]);

  // Generate session ID for wizard
  useEffect(() => {
    const existingSessionId = localStorage.getItem('wizard_session_id');
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = `wizard_${Date.now()}`;
      setSessionId(newSessionId);
      localStorage.setItem('wizard_session_id', newSessionId);
    }
  }, []);

  const handleOrderComplete = (orderId: string) => {
    toast({
      title: 'سفارش با موفقیت ایجاد شد',
      description: 'در حال انتقال به داشبورد...',
      variant: 'default'
    });
    
    // Navigate to dashboard after successful order creation
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleOrderSaved = (orderId: string) => {
    toast({
      title: 'سفارش برای بعد ذخیره شد',
      description: 'می‌توانید از داشبورد آن را پرداخت کنید',
      variant: 'default'
    });
    
    // Navigate to dashboard to show saved orders
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  // Show authentication prompt if user is not logged in
  if (showAuthPrompt) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="w-6 h-6 text-blue-500" />
            ورود به سیستم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              برای تکمیل سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>اطلاعات شما ذخیره شده و پس از ورود قابل مشاهده خواهد بود</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/auth')}
              className="flex-1 flex items-center gap-2"
              size="lg"
            >
              <LogIn className="w-4 h-4" />
              <span>ورود / ثبت‌نام</span>
            </Button>
            
            <Button
              onClick={() => setShowAuthPrompt(false)}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <span>بعداً</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>در حال بررسی وضعیت ورود...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show order summary and wizard order manager
  return (
    <div className="space-y-6">
      {/* Order Summary Card */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl">خلاصه سفارش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-1">نوع وب‌سایت</div>
              <Badge variant={wizardData.siteType === 'personal' ? 'default' : 'secondary'}>
                  {wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'}
              </Badge>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Layers className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-1">تعداد صفحات</div>
              <div className="text-2xl font-bold">
                {wizardData.websiteFramework?.dynamicDesign?.pages?.length || 0}
              </div>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Palette className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-1">رنگ اصلی</div>
              <div className="w-6 h-6 rounded-full mx-auto border-2 border-border" 
                   style={{ backgroundColor: wizardData.branding?.primaryColor || '#8B5CF6' }} />
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-sm text-muted-foreground mb-1">قیمت کل</div>
              <div className="text-2xl font-bold text-primary">
                {wizardData.pricing?.totalPrice?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-muted-foreground">تومان</div>
            </div>
          </div>

          {wizardData.userInfo?.domain && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">دامنه انتخاب شده</span>
              </div>
              <div className="font-mono text-lg text-blue-600 dark:text-blue-400">
                {wizardData.userInfo.domain}
                {wizardData.userInfo.additionalDomains && wizardData.userInfo.additionalDomains.length > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    + {wizardData.userInfo.additionalDomains.length} دامنه اضافی
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

             {/* Wizard Order Manager */}
       {sessionId && (
         <WizardOrderManager
           sessionId={sessionId}
           wizardData={{
             siteType: wizardData.siteType,
             websiteFramework: {
               dynamicDesign: {
                 pages: wizardData.websiteFramework?.dynamicDesign?.pages || [],
                 currentPageId: wizardData.websiteFramework?.dynamicDesign?.currentPageId || 'main'
               }
             },
             branding: {
               primaryColor: wizardData.branding?.primaryColor || '#8B5CF6',
               fontFamily: wizardData.branding?.fontFamily || 'vazir',
               logo: wizardData.branding?.logo || ''
             },
             pricing: {
               additionalServices: wizardData.pricing?.additionalServices || {},
               customizationLevel: wizardData.pricing?.customizationLevel || [3],
               rushDelivery: wizardData.pricing?.rushDelivery || false,
               totalPrice: wizardData.pricing?.totalPrice || 0
             },
             userInfo: {
               domain: wizardData.userInfo?.domain || '',
               domainExtension: wizardData.userInfo?.additionalDomains?.[0]?.extension
             }
           }}
           onOrderComplete={handleOrderComplete}
           onOrderSaved={handleOrderSaved}
         />
       )}

      {/* Navigation Help */}
      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <ArrowRight className="w-4 h-4" />
          <span>می‌توانید سفارش را تکمیل کنید یا برای بعد ذخیره کنید</span>
          </div>
      </div>
    </div>
  );
};

export default OrderSubmissionStep;