import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { calculateTotalPrice } from '@/lib/pricingUtils';
import { Check, Clock, CreditCard, UserPlus } from 'lucide-react';

interface FinalStepButtonProps {
  wizardData: any;
  isStepValid: boolean;
  updateWizardData: (data: any) => void;
}

const FinalStepButton = ({ wizardData, isStepValid, updateWizardData }: FinalStepButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const pricingBreakdown = calculateTotalPrice(wizardData);
  const totalCost = pricingBreakdown.totalPrice;

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

    setIsProcessing(true);

    try {
      const orderData = {
        user_id: user.id,
        title: `وب‌سایت ${wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'} - ${wizardData.userInfo?.domain || 'mywebsite'}`,
        description: JSON.stringify({
          siteType: wizardData.siteType,
          modules: wizardData.modules,
          branding: wizardData.branding,
          userInfo: wizardData.userInfo,
          pricing: wizardData.pricing,
          moduleLayout: wizardData.modules?.map((m: any, index: number) => ({
            ...m,
            position: index
          }))
        }),
        price: totalCost,
        status: 'saved', // Different status for saved projects
        payment_status: 'pending',
        comments: `پروژه ذخیره شده - دامنه: ${wizardData.userInfo?.domain || 'mywebsite'}.ir`
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) {
        throw error;
      }

      // Update user profile if needed
      if (wizardData.userInfo) {
        await supabase
          .from('profiles')
          .upsert(
            {
              user_id: user.id,
              full_name: wizardData.userInfo.name,
              email: wizardData.userInfo.email,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id'
            }
          );
      }

      toast({
        title: "پروژه ذخیره شد",
        description: "پروژه شما با موفقیت ذخیره شد. می‌توانید از داشبورد خود پرداخت را تکمیل کنید.",
      });

      navigate('/dashboard');

    } catch (error: any) {
      console.error('Save project error:', error);
      toast({
        title: "خطا در ذخیره پروژه",
        description: error.message || "مشکلی در ذخیره پروژه پیش آمد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
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
        <CardHeader>
          <CardTitle className="text-center">انتخاب نحوه پرداخت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={payNow}
              disabled={!isStepValid || isProcessing}
              className="btn-gradient flex items-center gap-2 h-16 flex-col"
            >
              <CreditCard className="w-5 h-5" />
              <div>
                <div className="font-medium">پرداخت فوری</div>
                <div className="text-xs opacity-80">پرداخت امن و شروع فوری پروژه</div>
              </div>
            </Button>
            
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
        </CardContent>
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