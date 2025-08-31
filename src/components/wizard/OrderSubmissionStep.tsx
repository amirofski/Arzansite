import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  Wallet
} from 'lucide-react';
import { calculateTotalPrice } from '@/lib/pricingUtils';
import { formatPriceWithUnit } from '@/lib/pricingUtils';
import { PRICING_CONFIG } from '@/lib/pricingUtils';
import { apiClient } from '@/lib/api-client';
import { DesignService } from '@/lib/designService';
import { mockApiClient } from '@/lib/wizardApiClient';
import { localOrders } from '@/lib/localOrders';
import { WalletService } from '@/lib/walletService';

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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCycle, setPaymentCycle] = useState<'monthly' | 'annual'>('monthly');
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'zarinpal'>('zarinpal');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated, authLoading]);

  // Fetch wallet balance when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWalletBalance();
    }
  }, [isAuthenticated, user]);

  const fetchWalletBalance = async () => {
    if (!user?.id) return;
    
    setWalletLoading(true);
    try {
      const balance = await WalletService.getWalletBalance(user.id);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      // Don't show error toast, just log it
    } finally {
      setWalletLoading(false);
    }
  };

  // Calculate pricing based on current selections
  const pricingBreakdown = calculateTotalPrice({
    siteType: wizardData.siteType,
    websiteFramework: wizardData.websiteFramework?.dynamicDesign
      ? { dynamicDesign: { pages: wizardData.websiteFramework.dynamicDesign.pages || [], currentPageId: wizardData.websiteFramework.dynamicDesign.currentPageId } }
      : undefined,
    branding: wizardData.branding,
    userInfo: wizardData.userInfo,
    additionalServices: wizardData.pricing?.additionalServices,
    paymentCycle
  });

  const totalCost = paymentCycle === 'annual' ? pricingBreakdown.annualPrice : pricingBreakdown.monthlyPrice;

  const handlePaymentCycleChange = (value: 'monthly' | 'annual') => {
    setPaymentCycle(value);
    updateData({ paymentCycle: value });
  };

  const handleAutoRenewalChange = (checked: boolean) => {
    setAutoRenewal(checked);
    updateData({ autoRenewal: checked });
  };

  // ZarinPal payment integration via backend payments API
  const initiateZarrinPalPayment = async (
    orderData: { id?: string; order_id?: string; price?: number; title?: string },
    fallbackPayload?: {
      title: string;
      description: string;
      price: number;
      comments?: string;
      total_pages?: number;
      total_sections?: number;
      siteType?: string;
      sessionId?: string;
      wizardData?: unknown;
    }
  ) => {
    try {
      const orderId = orderData.order_id || orderData.id;
      const amountTomans = typeof orderData.price === 'number' ? orderData.price : totalCost;
      const amountRials = Math.floor(amountTomans * 10);
      const description = `پرداخت سفارش ${orderData.title || orderId || ''}`.trim();

      // Persist fallback payload for callback recovery if orderId is not present
      if (!orderId && fallbackPayload) {
        localStorage.setItem('pending_order_payload', JSON.stringify(fallbackPayload));
      }

      const payment = await apiClient.requestPayment({
        amount: amountRials,
        description,
        orderId,
        callbackUrl: `${window.location.origin}/payment/callback`,
      });

      if (payment && payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }

      throw new Error('Failed to create payment request');
    } catch (error) {
      console.error('ZarrinPal payment initiation error:', error);
      throw error;
    }
  };

  // Handle wallet payment
  const handleWalletPayment = async (orderData: { id?: string; order_id?: string; title?: string }) => {
    try {
      if (walletBalance < totalCost) {
        toast({
          title: "موجودی ناکافی",
          description: `موجودی کیف پول شما ${WalletService.formatAmount(walletBalance)} است. برای تکمیل سفارش نیاز به ${WalletService.formatAmount(totalCost)} دارید.`,
          variant: "destructive",
        });
        return false;
      }

      // Process wallet payment
      const transactionId = await WalletService.payForOrder(
        user!.id,
        orderData.id || orderData.order_id,
        totalCost,
        orderData.title || 'سفارش وب‌سایت'
      );

      if (transactionId) {
        // Update order payment status
        await apiClient.updateOrder(
          orderData.id || orderData.order_id,
          { 
            payment_status: 'succeeded',
            status: 'in_progress'
          }
        );

        toast({
          title: "پرداخت موفق",
          description: `سفارش شما با موفقیت از کیف پول پرداخت شد. شناسه تراکنش: ${transactionId}`,
          variant: "default",
        });

        // Refresh wallet balance
        await fetchWalletBalance();
        
        // Navigate to success page or dashboard
        navigate('/dashboard?tab=orders&payment_success=true');
        return true;
      } else {
        throw new Error('Failed to process wallet payment');
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
      toast({
        title: "خطا در پرداخت کیف پول",
        description: "مشکلی در پرداخت از کیف پول پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
      return false;
    }
  };

  const submitOrder = async () => {
    // Check authentication first
    if (!isAuthenticated || !user) {
      toast({
        title: "نیاز به ورود",
        description: "برای ادامه پرداخت، لطفاً ابتدا وارد حساب کاربری خود شوید.",
        variant: "destructive",
      });
      setShowAuthPrompt(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Prepare payload once for reuse and possible callback recovery
      const apiOrderData = {
        title: `وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${wizardData.userInfo?.domain || 'mywebsite'}.ir`,
        description: 'سفارش ساخت وب‌سایت',
        price: totalCost,
        comments: `دامنه: ${wizardData.userInfo?.domain || 'mywebsite'}.ir | دوره پرداخت: ${paymentCycle === 'annual' ? 'سالانه' : 'ماهانه'} | تمدید خودکار: ${autoRenewal ? 'بله' : 'خیر'}`,
        total_pages: wizardData.websiteFramework?.dynamicDesign?.pages?.length || 1,
        total_sections:
          wizardData.websiteFramework?.dynamicDesign?.pages?.reduce(
            (total: number, page: { sections?: Array<{ id: string }> }) => total + (page.sections?.length || 0),
            0
          ) || 0,
        siteType: wizardData.siteType,
        sessionId: `wizard_${Date.now()}`,
        wizardData: {
          websiteFramework: wizardData.websiteFramework,
          branding: wizardData.branding,
          domains: {
            primary_domain: wizardData.userInfo?.domain || 'mywebsite',
            additional_domains: wizardData.userInfo?.additionalDomains || [],
          },
          pricing: {
            basePrice: pricingBreakdown.basePrice,
            pagesCost: pricingBreakdown.pagesCost,
            sectionsCost: pricingBreakdown.sectionsCost,
            additionalServicesCost: pricingBreakdown.additionalServicesCost,
            totalPrice: totalCost,
            paymentCycle,
            autoRenewal,
            annualDiscount: paymentCycle === 'annual' ? pricingBreakdown.annualDiscount : 0,
          },
          additionalServices: wizardData.pricing?.additionalServices || {},
        },
      };

      // First, create the order in our system
      let newOrder: { id: string; title?: string; price?: number };
      try {
        newOrder = await apiClient.createOrder(apiOrderData);
      } catch (orderError) {
        console.error('Order creation error:', orderError);
        // Persist a local draft so it shows in dashboard and can be paid later
        const draft = localOrders.save({
          ...apiOrderData,
        });
        newOrder = { id: draft.id, title: draft.payload.title, price: draft.payload.price };
      }

      // Save design data if available and order exists on backend
      if (
        wizardData.websiteFramework?.dynamicDesign &&
        !newOrder.id.startsWith('mock_') &&
        !newOrder.id.startsWith('local_')
      ) {
        try {
          await DesignService.saveDesign(
            newOrder.id,
            wizardData.websiteFramework.dynamicDesign as import('@/lib/designService').DynamicDesign,
            {
              siteType: wizardData.siteType,
              modules: wizardData.modules,
              branding: wizardData.branding,
              userInfo: wizardData.userInfo,
              pricing: wizardData.pricing
            }
          );
        } catch (designError) {
          console.warn('Design save warning:', designError);
          // Don't throw error for design issues, continue with order
        }
      }

      // Update user profile if needed (allowed fields only)
      if (wizardData.userInfo) {
        try {
          await apiClient.updateProfile({
            full_name: wizardData.userInfo.name,
          });
        } catch (profileError) {
          console.warn('Profile update warning:', profileError);
          // Don't throw error for profile issues, continue with order
        }
      }

      // Show success message
      toast({
        title: "سفارش ثبت شد",
        description: "سفارش شما با موفقیت ثبت شد. در حال پردازش پرداخت...",
        variant: "default",
      });

      // Process payment based on selected method
      if (paymentMethod === 'wallet') {
        const walletSuccess = await handleWalletPayment(newOrder);
        if (!walletSuccess) {
          setIsProcessing(false);
          return;
        }
      } else {
        // ZarinPal payment
        if (newOrder.id.startsWith('local_')) {
          await initiateZarrinPalPayment({ ...newOrder }, apiOrderData);
        } else {
          await initiateZarrinPalPayment({ ...newOrder, order_id: newOrder.id });
        }
      }

    } catch (error) {
      console.error('Order submission error:', error);
      
      let errorMessage = "متأسفانه خطایی در ثبت سفارش رخ داد. لطفاً دوباره تلاش کنید.";
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('Authentication failed')) {
          errorMessage = "جلسه شما منقضی شده است. لطفاً دوباره وارد شوید.";
          setShowAuthPrompt(true);
        } else if (error.message.includes('Payment')) {
          errorMessage = "خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطا در ثبت سفارش",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">تأیید و پرداخت سفارش</h2>
        <p className="text-muted-foreground">
          اطلاعات سفارش خود را بررسی کرده و روش پرداخت را انتخاب کنید
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            خلاصه سفارش
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">نوع وب‌سایت</h4>
                <p className="text-sm text-muted-foreground">
                  {wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-semibold">دامنه</h4>
                <p className="text-sm text-muted-foreground">
                  {wizardData.userInfo?.domain || 'mywebsite'}.ir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">تعداد صفحات</h4>
                <p className="text-sm text-muted-foreground">
                  {pricingBreakdown.pagesCount} صفحه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">تعداد بخش‌ها</h4>
                <p className="text-sm text-muted-foreground">
                  {pricingBreakdown.totalSections} بخش
                </p>
              </div>
            </div>
          </div>

          {wizardData.pricing?.additionalServices && Object.values(wizardData.pricing.additionalServices).some(Boolean) && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">خدمات اضافی انتخاب شده:</h4>
              <div className="flex flex-wrap gap-2">
                {wizardData.pricing?.additionalServices?.seoOptimization && (
                  <Badge variant="secondary">SEO</Badge>
                )}
                {wizardData.pricing?.additionalServices?.socialMediaIntegration && (
                  <Badge variant="secondary">شبکه‌های اجتماعی</Badge>
                )}
                {wizardData.pricing?.additionalServices?.analyticsSetup && (
                  <Badge variant="secondary">آنالیتیکس</Badge>
                )}
                {wizardData.pricing?.additionalServices?.backupService && (
                  <Badge variant="secondary">پشتیبان‌گیری</Badge>
                )}
                {wizardData.pricing?.additionalServices?.maintenancePlan && (
                  <Badge variant="secondary">نگهداری</Badge>
                )}
                {wizardData.pricing?.additionalServices?.rushDelivery && (
                  <Badge variant="secondary">تحویل فوری</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            گزینه‌های پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">روش پرداخت</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: 'wallet' | 'zarinpal') => setPaymentMethod(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">پرداخت از کیف پول</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    موجودی: {walletLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : (
                      WalletService.formatAmount(walletBalance)
                    )}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zarinpal" id="zarinpal" />
                <Label htmlFor="zarinpal" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">پرداخت آنلاین</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    از طریق درگاه زرین‌پال
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Wallet Payment Info */}
            {paymentMethod === 'wallet' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">اطلاعات پرداخت کیف پول</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>موجودی فعلی:</span>
                    <span className="font-medium">{WalletService.formatAmount(walletBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مبلغ سفارش:</span>
                    <span className="font-medium">{formatPriceWithUnit(totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>موجودی پس از پرداخت:</span>
                    <span className={`font-medium ${walletBalance >= totalCost ? 'text-green-600' : 'text-red-600'}`}>
                      {WalletService.formatAmount(walletBalance - totalCost)}
                    </span>
                  </div>
                </div>
                {walletBalance < totalCost && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">موجودی ناکافی</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      برای تکمیل این سفارش نیاز به شارژ کیف پول دارید.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-xs"
                      onClick={() => navigate('/dashboard?tab=wallet')}
                    >
                      شارژ کیف پول
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ZarinPal Payment Info */}
            {paymentMethod === 'zarinpal' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">اطلاعات پرداخت آنلاین</span>
                </div>
                <p className="text-sm text-blue-700">
                  پرداخت شما از طریق درگاه امن زرین‌پال انجام می‌شود. 
                  پس از تکمیل پرداخت، به این صفحه بازخواهید گشت.
                </p>
              </div>
            )}
          </div>

          {/* Payment Cycle Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">دوره پرداخت</Label>
            <RadioGroup
              value={paymentCycle}
              onValueChange={handlePaymentCycleChange}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  <div className="text-sm font-medium">پرداخت ماهانه</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPriceWithUnit(pricingBreakdown.monthlyPrice)} در ماه
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annual" id="annual" />
                <Label htmlFor="annual" className="cursor-pointer">
                  <div className="text-sm font-medium">پرداخت سالانه</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPriceWithUnit(pricingBreakdown.annualPrice)} در سال
                    <Badge variant="secondary" className="ml-2">10% تخفیف</Badge>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Auto-Renewal Option */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">تمدید خودکار</Label>
              <p className="text-xs text-muted-foreground">
                {paymentCycle === 'annual' 
                  ? 'صورتحساب سالانه به صورت خودکار ایجاد و ارسال می‌شود'
                  : 'صورتحساب ماهانه به صورت خودکار ایجاد و ارسال می‌شود'
                }
              </p>
            </div>
            <Switch
              checked={autoRenewal}
              onCheckedChange={handleAutoRenewalChange}
            />
          </div>

          {/* Final Price Display */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">قیمت نهایی</h3>
                <p className="text-sm text-muted-foreground">
                  {paymentCycle === 'annual' ? 'پرداخت سالانه' : 'پرداخت ماهانه'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatPriceWithUnit(totalCost)}
                </div>
                {paymentCycle === 'annual' && (
                  <div className="text-sm text-green-600">
                    صرفه‌جویی: {formatPriceWithUnit(pricingBreakdown.annualDiscount)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <div className="flex justify-center">
        <Button
          onClick={submitOrder}
          disabled={isProcessing || !user || (paymentMethod === 'wallet' && walletBalance < totalCost)}
          size="lg"
          className="btn-gradient px-8 py-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              در حال پردازش...
            </>
          ) : (
            <>
              {paymentMethod === 'wallet' ? (
                <Wallet className="w-4 h-4 mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {paymentMethod === 'wallet' ? 'پرداخت از کیف پول' : 'پرداخت و تکمیل سفارش'}
            </>
          )}
        </Button>
      </div>

      {/* Payment Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">اطلاعات پرداخت</p>
              <p>پرداخت شما از طریق درگاه امن زرین‌پال انجام می‌شود. تمام اطلاعات محافظت شده و امن هستند.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAuthPrompt && (
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            برای ادامه پرداخت، لطفاً ابتدا وارد حساب کاربری خود شوید.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="btn-gradient mt-4"
          >
            <LogIn className="w-4 h-4 mr-2" />
            ورود به حساب کاربری
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrderSubmissionStep;