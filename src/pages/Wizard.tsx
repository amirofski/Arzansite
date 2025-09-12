import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check, Save } from 'lucide-react';
import StepOne from '@/components/wizard/StepOne';
import StepTwo from '@/components/wizard/StepTwo';
import StepThree from '@/components/wizard/StepThree';
import StepFour from '@/components/wizard/StepFour';
import StepFive from '@/components/wizard/StepFive';
import OrderSubmissionStep from '@/components/wizard/OrderSubmissionStep';
import FinalStepButton from '@/components/wizard/FinalStepButton';
import Layout from "@/components/ui/Layout";
import { useToast } from '@/hooks/use-toast';
import { wizardService } from '@/lib/services';
import { useAuth } from '@/hooks/useAuth';

interface WizardData {
  siteType: 'personal' | 'business' | '';
  pageMode?: 'single' | 'multi' | '';
  websiteFramework?: {
    selectedLayouts: Record<string, string>;
    uploadedImages: Record<string, string>;
    pageStructure: 'single' | 'multi';
    customPages?: string[];
    canvasDimensions: {
      width: number;
      height: number;
    };
    // New dynamic design format
    dynamicDesign?: {
      pages: Array<{
        id: string;
        name: string;
        sections: Array<{
          id: string;
          sectionType: string;
          layoutId: string;
          order: number;
          customData?: {
            title?: string;
            content?: string;
            images?: string[];
          };
        }>;
        canvasDimensions: {
          width: number;
          height: number;
        };
      }>;
      currentPageId: string;
    };
  };
  wireframe?: {
    pages: Array<{
      id: string;
      name: string;
      elements: Array<{
        id: string;
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        label?: string;
      }>;
    }>;
    currentPageId: string;
    canvasWidth: number;
    canvasHeight: number;
  };
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
  branding: {
    primaryColor: string;
    fontFamily: string;
    logo: string;
  };
  pricing: {
    additionalServices: Record<string, boolean>;
    customizationLevel: number[];
    rushDelivery: boolean;
    totalPrice: number;
  };
  // New payment cycle interface
  paymentCycle?: 'monthly' | 'annual';
  autoRenewal?: boolean;
  userInfo: {
    name?: string;
    email?: string;
    domain: string;
    domainExtension?: string;
    domainPrice?: string;
    additionalDomains?: Array<{
      domain: string;
      extension: string;
      price: number;
      available: boolean;
    }>;
  };
}

const Wizard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  const [wizardData, setWizardData] = useState<WizardData>({
    siteType: '',
    pageMode: '',
    modules: [],
    branding: {
      primaryColor: '#8B5CF6',
      fontFamily: 'vazir',
      logo: ''
    },
    pricing: {
      additionalServices: {},
      customizationLevel: [3],
      rushDelivery: false,
      totalPrice: 0
    },
    userInfo: {
      domain: ''
    }
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Generate unique session ID for guest users
  const generateSessionId = useCallback(() => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }, []);

  // Save wizard progress to backend
  const saveWizardProgress = useCallback(async (data: WizardData) => {
    try {
      setIsAutoSaving(true);

      // If no token yet (guest or just logged in), save locally without server call
      try {
        const { tokenManager } = await import('@/lib/tokenManager');
        let token = tokenManager.getAccessToken();
        if (!token) {
          tokenManager.forceRefreshFromStorage();
          token = tokenManager.getAccessToken();
        }
        if (!token) {
          localStorage.setItem(`wizard_progress_${sessionId}`, JSON.stringify(data));
          localStorage.setItem('wizard_session_id', sessionId);
          setHasUnsavedChanges(false);
          return;
        }
      } catch {}
      
      // Use new wizard service for saving progress
      // Try to include user_id if available
      const userId = (user as any)?.id || (user as any)?.user_id || (user as any)?.$id || (user as any)?.userId || (user as any)?._id;
      await wizardService.saveProgress(
        sessionId,
        data as unknown as Record<string, unknown>,
        userId ? { userId: String(userId) } : undefined
      );
      
      // Also save to localStorage as backup
      localStorage.setItem(`wizard_progress_${sessionId}`, JSON.stringify(data));
      localStorage.setItem('wizard_session_id', sessionId);
      
      setHasUnsavedChanges(false);
      
      // Show success toast for auto-save
      if (isAutoSaving) {
        toast({
          title: 'پیشرفت ذخیره شد',
          description: 'اطلاعات شما به صورت خودکار ذخیره شد',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Failed to save wizard progress:', error);
      // Suppress error toasts during auto-save to reduce noise
      if (!isAutoSaving) {
        const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره‌سازی پیشرفت';
        toast({
          title: 'خطا در ذخیره‌سازی',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsAutoSaving(false);
    }
  }, [sessionId, toast, isAutoSaving, setHasUnsavedChanges, user]);

  // Determine current step based on progress
  const determineCurrentStep = useCallback((progress: WizardData): number => {
    if (!progress.siteType) return 1;
    if (!progress.websiteFramework?.dynamicDesign?.pages || 
        progress.websiteFramework.dynamicDesign.pages.length === 0) return 2;
    if (!progress.branding?.primaryColor || !progress.branding?.fontFamily) return 3;
    if (!progress.userInfo?.domain) return 4;
    if (!progress.pricing?.totalPrice || progress.pricing.totalPrice <= 0) return 5;
    return 6;
  }, []);

  // Recover wizard progress from backend
  const recoverWizardProgress = useCallback(async (sessionId: string) => {
    try {
      // If there's no token, skip server calls and attempt local recovery only
      try {
        const { tokenManager } = await import('@/lib/tokenManager');
        let token = tokenManager.getAccessToken();
        if (!token) {
          tokenManager.forceRefreshFromStorage();
          token = tokenManager.getAccessToken();
        }
        if (!token) {
          const saved = localStorage.getItem(`wizard_progress_${sessionId}`);
          const progressLocal = saved ? JSON.parse(saved) : {};
          const mappedLocal = progressLocal && typeof progressLocal === 'object' ? (progressLocal as any) : {};
          // Map to state from local
          const mappedProgressLocal: WizardData = {
            siteType: mappedLocal.siteType || '',
            pageMode: '',
            modules: mappedLocal.modules || [],
            websiteFramework: mappedLocal.websiteFramework || {
              selectedLayouts: {},
              uploadedImages: {},
              pageStructure: 'single',
              canvasDimensions: { width: 1200, height: 2000 },
            },
            wireframe: undefined,
            branding: mappedLocal.branding || {
              primaryColor: '#8B5CF6',
              fontFamily: 'vazir',
              logo: ''
            },
            pricing: mappedLocal.pricing || {
              additionalServices: {},
              customizationLevel: [3],
              rushDelivery: false,
              totalPrice: 0
            },
            userInfo: mappedLocal.userInfo || { domain: '' }
          };
          setWizardData(mappedProgressLocal);
          setCurrentStep(determineCurrentStep(mappedProgressLocal));
          return;
        }
      } catch {}

      // Use new wizard service for loading progress
      const progress = await wizardService.loadProgress(sessionId);
      
      // Map API response to WizardData format
      // Use partial typing with fallbacks to satisfy strict typing
      const mappedProgress: WizardData = {
        siteType: ((progress as { siteType?: WizardData['siteType'] }).siteType) || '',
        pageMode: '',
        modules: [],
        websiteFramework: (progress as unknown as { websiteFramework?: WizardData['websiteFramework'] }).websiteFramework || {
          selectedLayouts: {},
          uploadedImages: {},
          pageStructure: 'single',
          canvasDimensions: { width: 1200, height: 2000 },
        },
        wireframe: undefined,
        branding: (progress as unknown as { branding?: WizardData['branding'] }).branding || {
          primaryColor: '#8B5CF6',
          fontFamily: 'vazir',
          logo: ''
        },
        pricing: (progress as unknown as { pricing?: WizardData['pricing'] }).pricing || {
          additionalServices: {},
          customizationLevel: [3],
          rushDelivery: false,
          totalPrice: 0
        },
        paymentCycle: undefined,
        autoRenewal: undefined,
        userInfo: (progress as unknown as { domains?: { primaryDomain?: string; additionalDomains?: Array<{ domain: string; extension: string; price: number; available: boolean }> } }).domains ? {
          domain: ((progress as unknown as { domains?: { primaryDomain?: string } }).domains?.primaryDomain) || '',
          domainExtension: undefined,
          domainPrice: undefined,
          additionalDomains: ((progress as unknown as { domains?: { additionalDomains?: Array<{ domain: string; extension: string; price: number; available: boolean }> } }).domains?.additionalDomains)
        } : {
          domain: ''
        }
      };
      
      setWizardData(mappedProgress);
      
      // Determine current step based on progress
      const recoveredStep = determineCurrentStep(mappedProgress);
      setCurrentStep(recoveredStep);
      
      toast({
        title: 'پیشرفت بازیابی شد',
        description: 'اطلاعات قبلی شما بازیابی شد',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to recover wizard progress:', error);
      
      // Handle error with user-friendly message
      const errorMessage = error instanceof Error ? error.message : 'خطا در بازیابی پیشرفت';
      
      toast({
        title: 'خطا در بازیابی',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast, determineCurrentStep]);

  const steps = [
    { number: 1, title: 'نوع سایت', description: 'انتخاب نوع وب‌سایت' },
    { number: 2, title: 'طراحی', description: 'ساختار و طراحی سایت' },
    { number: 3, title: 'برندینگ', description: 'طراحی و هویت بصری' },
    { number: 4, title: 'انتخاب دامنه', description: 'انتخاب دامنه وب‌سایت' },
    { number: 5, title: 'قیمت‌گذاری', description: 'محاسبه قیمت نهایی' },
    { number: 6, title: 'تأیید', description: 'تکمیل و ارسال سفارش' },
  ];

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
    setHasUnsavedChanges(true);
  };

  // Initialize session and recover progress on component mount
  useEffect(() => {
    const existingSessionId = localStorage.getItem('wizard_session_id');
    if (existingSessionId) {
      setSessionId(existingSessionId);
      recoverWizardProgress(existingSessionId);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
    }
  }, [generateSessionId, recoverWizardProgress]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!sessionId) return;

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveWizardProgress(wizardData);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [sessionId, hasUnsavedChanges, wizardData, saveWizardProgress]);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        saveWizardProgress(wizardData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, wizardData, saveWizardProgress]);

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      // Save progress before moving to next step
      if (hasUnsavedChanges) {
        await saveWizardProgress(wizardData);
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = async () => {
    if (currentStep > 1) {
      // Save progress before moving to previous step
      if (hasUnsavedChanges) {
        await saveWizardProgress(wizardData);
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  // Auto-advancement handler
  const handleAutoAdvance = async () => {
    // Save progress before auto-advancing
    if (hasUnsavedChanges) {
      await saveWizardProgress(wizardData);
    }
    nextStep();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne data={wizardData} updateData={updateWizardData} onAutoAdvance={handleAutoAdvance} />;
      case 2:
        return <StepTwo data={wizardData} updateData={updateWizardData} onAutoAdvance={handleAutoAdvance} />;
      case 3:
        return <StepThree data={wizardData} updateData={updateWizardData} />;
      case 4:
        return <StepFive data={wizardData} updateData={updateWizardData} />;
      case 5:
        return <StepFour data={wizardData} updateData={updateWizardData} />;
      case 6:
        return <OrderSubmissionStep data={wizardData} updateData={updateWizardData} />;
      default:
        return <StepOne data={wizardData} updateData={updateWizardData} onAutoAdvance={handleAutoAdvance} />;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return wizardData.siteType !== '';
      case 2:
        // Check for new dynamic design structure - at least one section must be added
        if (wizardData.websiteFramework?.dynamicDesign?.pages) {
          const totalSections = wizardData.websiteFramework.dynamicDesign.pages.reduce(
            (total: number, page) => total + page.sections.length, 0
          );
          return totalSections > 0;
        }
        // Fallback to old structure for backward compatibility
        return wizardData.websiteFramework && 
               wizardData.websiteFramework.selectedLayouts && 
               Object.keys(wizardData.websiteFramework.selectedLayouts).length > 0;
      case 3:
        return wizardData.branding.primaryColor !== '' && wizardData.branding.fontFamily !== '';
      case 4:
        return !!(wizardData.userInfo.domain);
      case 5:
        return wizardData.pricing?.totalPrice > 0;
      default:
        return true;
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>ساخت سایت | {siteConfig.seo.defaultTitle}</title>
        <meta name="description" content="فرآیند ساخت سایت با {siteConfig.name}. در چند قدم ساده وب‌سایت خود را بسازید." />
        <link rel="canonical" href={siteConfig.seo.siteUrl + '/wizard'} />
      </Helmet>
      <div className="min-h-screen bg-background mt-20 pt-16">
        <div className="container mx-auto px-4">
          {/* Quick ping widget (full debug tools moved to /debug) */}
          <div className="mb-6">
          </div>
          
          {/* Progress */}
          <div className="mb-8">
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 text-sm text-muted-foreground">
              <span className="text-center sm:text-right">قدم {currentStep} از {totalSteps}</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <span className="text-center sm:text-left">{Math.round(progress)}% تکمیل شده</span>
                {/* Auto-save indicator */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {isAutoSaving ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs hidden sm:inline">در حال ذخیره...</span>
                      <span className="text-xs sm:hidden">ذخیره...</span>
                    </div>
                  ) : hasUnsavedChanges ? (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Save className="w-3 h-3" />
                      <span className="text-xs hidden sm:inline">تغییرات ذخیره نشده</span>
                      <span className="text-xs sm:hidden">تغییرات</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-3 h-3" />
                      <span className="text-xs hidden sm:inline">ذخیره شده</span>
                      <span className="text-xs sm:hidden">ذخیره</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Steps Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`step-indicator w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-200 ${
                        currentStep === step.number
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-110'
                          : currentStep > step.number
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="text-center mt-2 max-w-[120px] sm:max-w-none">
                      <div className="text-xs sm:text-sm font-medium leading-tight">{step.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 hidden sm:block leading-tight">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block w-8 h-px bg-border mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Step Content */}
          <Card className="card-modern mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-center sm:text-right">
                <span className="block sm:inline">{steps[currentStep - 1].title}</span>
                <span className="hidden sm:inline"> - </span>
                <span className="block sm:inline text-muted-foreground">{steps[currentStep - 1].description}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="fade-in">
                {renderStep()}
              </div>
            </CardContent>
          </Card>
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2 order-2 sm:order-1"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">قدم قبلی</span>
              <span className="sm:hidden">قبلی</span>
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
              {/* Manual Save Button */}
              <Button
                onClick={() => saveWizardProgress(wizardData)}
                disabled={!hasUnsavedChanges || isAutoSaving}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                {isAutoSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">در حال ذخیره...</span>
                    <span className="sm:hidden">ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">ذخیره پیشرفت</span>
                    <span className="sm:hidden">ذخیره</span>
                  </>
                )}
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="btn-gradient flex items-center gap-2"
                >
                  <span className="hidden sm:inline">قدم بعدی</span>
                  <span className="sm:hidden">بعدی</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : (
                <FinalStepButton 
                  wizardData={wizardData} 
                  isStepValid={isStepValid()}
                  updateWizardData={updateWizardData}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Wizard;