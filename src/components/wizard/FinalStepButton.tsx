import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { wizardService, authService, useApi } from '@/lib/services';
import { calculateTotalPrice, PricingData } from '@/lib/pricingUtils';
import { Check, Clock, CreditCard, UserPlus } from 'lucide-react';
import { localOrders } from '@/lib/localOrders';

type WizardDataLite = {
  siteType: 'personal' | 'business' | '';
  userInfo?: { domain?: string; name?: string };
  modules?: Array<Record<string, unknown>>;
  branding?: Record<string, unknown>;
  pricing?: { additionalServices?: Record<string, boolean> };
  websiteFramework?: unknown;
};

interface FinalStepButtonProps {
  wizardData: WizardDataLite;
  isStepValid: boolean;
  updateWizardData: (data: Partial<WizardDataLite> & Record<string, unknown>) => void;
}

const FinalStepButton = ({ wizardData, isStepValid, updateWizardData }: FinalStepButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // New API hooks for wizard completion and profile update
  const { execute: completeWizardOrder } = useApi(
    wizardService.completeOrder.bind(wizardService),
    { 
      onSuccess: handleWizardOrderSuccess,
      onError: handleWizardOrderError
    }
  );

  const { execute: updateProfile } = useApi(
    authService.updateProfile.bind(authService),
    { 
      onError: (error) => console.warn('Profile update warning:', error)
    }
  );

  // Handle successful wizard order completion
  function handleWizardOrderSuccess() {
    toast({
      title: "پروژه ذخیره شد",
      description: "پروژه شما با موفقیت ذخیره شد. می‌توانید از داشبورد خود پرداخت را تکمیل کنید.",
    });
    navigate('/dashboard');
  }

  // Handle wizard order completion error
  function handleWizardOrderError(error: Error) {
    console.warn('Wizard order completion failed, saving as local draft:', error);
    // This will be handled in the saveProjectLater function
  }

  const pricingInput: PricingData = {
    siteType: wizardData.siteType,
    websiteFramework: (wizardData as unknown as PricingData).websiteFramework,
    branding: (wizardData as unknown as PricingData).branding,
    userInfo: (wizardData as unknown as PricingData).userInfo,
    additionalServices: wizardData.pricing?.additionalServices,
  };
  const pricingBreakdown = calculateTotalPrice(pricingInput);
  const totalCost = pricingBreakdown.totalPrice;

  // Simple in-flight lock to prevent multiple submissions
  let inFlight = false;

  const saveProjectLater = async () => {
    if (!user) {
      toast({
        title: "خطا",
        description: "برای ذخیره پروژه باید وارد شوید",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (isProcessing || inFlight) return; // prevent duplicate requests
    setIsProcessing(true);
    inFlight = true;

    let orderData: {
      title: string;
      description: string;
      price: number;
      comments: string;
      siteType: string;
      sessionId: string;
      wizardData: Record<string, unknown>;
    } | null = null;

    try {
      orderData = {
        title: `وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${wizardData.userInfo?.domain || 'mywebsite'}`,
        description: 'پروژه ذخیره شده',
        price: totalCost,
        comments: `پروژه ذخیره شده - دامنه: ${wizardData.userInfo?.domain || 'mywebsite'}.ir`,
        siteType: wizardData.siteType,
        sessionId: `wizard_${Date.now()}`,
        wizardData: {
          modules: wizardData.modules,
          branding: wizardData.branding,
          userInfo: wizardData.userInfo,
          pricing: wizardData.pricing,
          moduleLayout: (wizardData.modules || []).map((m: { [key: string]: unknown }, index: number) => ({
            ...m,
            position: index,
          })),
        }
      };

      // Use wizard completion endpoint
      try {
        await completeWizardOrder({
          sessionId: orderData.sessionId,
          userId: user!.id,
          order: {
            title: orderData.title,
            description: orderData.description,
            priceTomans: orderData.price,
            comments: orderData.comments,
            siteType: orderData.siteType as 'personal' | 'business'
          },
          designSnapshot: {
            websiteFramework: wizardData.websiteFramework,
            branding: wizardData.branding,
            additionalServices: wizardData.pricing?.additionalServices || {},
            domains: {
              primary_domain: wizardData.userInfo?.domain || 'mywebsite',
              additional_domains: []
            },
            pricing: wizardData.pricing || {},
            paymentOptions: {}
          }
        });
      } catch (_e) {
        // Do not send additional POSTs to /orders; persist a local draft so user can try later
        const draft = localOrders.save({ ...orderData });
        console.warn('Saved local draft due to backend error, id:', draft.id);
      }

      // Update user profile if needed (allowed fields only)
      if (wizardData.userInfo?.name) {
        await updateProfile({
          fullName: wizardData.userInfo.name,
        });
      }

      // Success handling is done in handleWizardOrderSuccess

    } catch (error: unknown) {
      console.error('Save project error:', error);
      try {
        const fallback = orderData ?? {
          title: `وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${wizardData.userInfo?.domain || 'mywebsite'}`,
          description: 'پروژه ذخیره شده',
          price: totalCost,
          comments: `پروژه ذخیره شده - دامنه: ${wizardData.userInfo?.domain || 'mywebsite'}.ir`,
          siteType: wizardData.siteType,
          sessionId: `wizard_${Date.now()}`,
          wizardData: {
            modules: wizardData.modules,
            branding: wizardData.branding,
            userInfo: wizardData.userInfo,
            pricing: wizardData.pricing,
            moduleLayout: (wizardData.modules || []).map((m: Record<string, unknown>, index: number) => ({
              ...m,
              position: index,
            })),
          },
        };

        const draft = localOrders.save(fallback);
        toast({
          title: 'پروژه به صورت پیش‌نویس ذخیره شد',
          description: 'می‌توانید از داشبورد پرداخت را تکمیل کنید',
        });
        navigate('/dashboard');
        return;
      } catch (e) {
        // ignore
      }
      toast({
        title: "خطا در ذخیره پروژه",
        description: error instanceof Error ? error.message : "مشکلی در ذخیره پروژه پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      inFlight = false;
      setIsProcessing(false);
    }
  };

  const payNow = async () => {
    setIsProcessing(true);
    updateWizardData({ paymentChoice: 'immediate' });
    // This will trigger the OrderSubmissionStep payment flow
    setIsProcessing(false);
  };

  const handleSignupAndContinue = () => {
    // Store wizard data in localStorage for after signup
    localStorage.setItem('pendingWizardData', JSON.stringify(wizardData));
    navigate('/auth?redirect=wizard-complete');
  };

  // If user is not authenticated, show signup option
  if (!user) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-center">تکمیل سفارش</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            برای ادامه، لطفاً ثبت‌نام کنید یا وارد شوید
          </p>
          <Button
            onClick={handleSignupAndContinue}
            disabled={!isStepValid}
            className="btn-gradient flex items-center gap-2 w-full"
          >
            <UserPlus className="w-4 h-4" />
            ثبت‌نام و ادامه
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If authenticated user hasn't chosen payment option yet
  if (!showPaymentChoice) {
    return (
      <Card className="mb-4">
        {/* <CardHeader>
          <CardTitle className="text-center">انتخاب نحوه پرداخت</CardTitle>
        </CardHeader> */}
        {/* <CardContent className="space-y-4"> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <Button
              onClick={payNow}
              disabled={!isStepValid || isProcessing}
              className="btn-gradient flex items-center gap-2 h-16 flex-col"
            >
              <CreditCard className="w-5 h-5" />
              <div>
                <div className="font-medium">پرداخت فوری</div>
                <div className="text-xs opacity-80">پرداخت امن و شروع فوری پروژه</div>
              </div>
            </Button> */}
            
            <Button
              onClick={saveProjectLater}
              disabled={!isStepValid || isProcessing}
              variant="outline"
              className="flex items-center gap-2 h-16 flex-col"
            >
              <Clock className="w-5 h-5" />
              <div>
                <div className="font-medium">ذخیره و پرداخت بعدی</div>
                <div className="text-xs opacity-80">ذخیره پروژه در داشبورد</div>
              </div>
            </Button>
          </div>
          
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              در حال پردازش...
            </div>
          )}
        {/* </CardContent> */}
      </Card>
    );
  }

  // If user chose immediate payment, show the complete order button
  return (
    <Button
      disabled={!isStepValid || isProcessing}
      className="btn-gradient flex items-center gap-2"
    >
      {isProcessing ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          در حال پردازش...
        </>
      ) : (
        <>
          تکمیل سفارش
          <Check className="w-4 h-4" />
        </>
      )}
    </Button>
  );
};

export default FinalStepButton;