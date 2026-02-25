import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import StepOne from '@/components/wizard/StepOne';
import StepTwo from '@/components/wizard/StepTwo';
import StepThree from '@/components/wizard/StepThree';
import StepFour from '@/components/wizard/StepFour';
import StepFive from '@/components/wizard/StepFive';
import OrderSubmissionStep from '@/components/wizard/OrderSubmissionStep';
import { useLocation } from 'react-router-dom';
import { ordersService } from '@/lib/services';
import Layout from "@/components/ui/Layout";

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
  const [currentStep, setCurrentStep] = useState(1);

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

  // EDIT MODE: if /wizard?mode=edit&orderId=... then seed wizardData from local source or API
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const orderId = params.get('orderId');
    if (mode !== 'edit') return;

    (async () => {
      let payload: any | undefined;
      try {
        const raw = localStorage.getItem('pendingWizardEdit');
        if (raw) {
          payload = JSON.parse(raw);
        }
      } catch {}

      if (!payload && orderId) {
        try {
          const detail = await ordersService.getOrder(orderId);
          const o: any = (detail as any)?.order || detail;
          let wiz: any = o?.wizardData || o?.wizard_data;
          if (typeof wiz === 'string') { try { wiz = JSON.parse(wiz); } catch { wiz = undefined; } }
          if (!wiz && typeof o?.description === 'string') { try { wiz = JSON.parse(o.description); } catch {} }
          payload = wiz;
        } catch (e) {
          console.warn('Failed to load order for edit mode:', e);
        }
      }

      if (payload && typeof payload === 'object') {
        const wf = payload.websiteFramework || {};
        const dd = wf.dynamicDesign || undefined;
        const branding = payload.branding || { primaryColor: '#8B5CF6', fontFamily: 'vazir', logo: '' };
        const pricing = payload.pricing || { additionalServices: {}, customizationLevel: [3], rushDelivery: false, totalPrice: 0 };
        const domains = payload.domains || {};
        const userInfo = payload.userInfo || { domain: domains.primaryDomain || '' };

        const seeded: WizardData = {
          siteType: payload.siteType || '',
          pageMode: '',
          modules: payload.modules || [],
          websiteFramework: {
            selectedLayouts: wf.selectedLayouts || {},
            uploadedImages: wf.uploadedImages || {},
            pageStructure: wf.pageStructure || 'single',
            customPages: wf.customPages || [],
            canvasDimensions: wf.canvasDimensions || { width: 1200, height: 2000 },
            dynamicDesign: dd,
          },
          branding,
          pricing,
          userInfo: {
            domain: userInfo.domain || domains.primaryDomain || '',
            domainExtension: userInfo.domainExtension || domains.domainExtension,
            additionalDomains: domains.additionalDomains || userInfo.additionalDomains || [],
          },
        };
        setWizardData(seeded);
        // Advance to appropriate step
        const step = (() => {
          if (!seeded.siteType) return 1;
          if (!seeded.websiteFramework?.dynamicDesign?.pages || seeded.websiteFramework.dynamicDesign.pages.length === 0) return 2;
          if (!seeded.branding?.primaryColor || !seeded.branding?.fontFamily) return 3;
          if (!seeded.userInfo?.domain) return 4;
          if (!seeded.pricing?.totalPrice || seeded.pricing.totalPrice <= 0) return 5;
          return 6;
        })();
        setCurrentStep(step);
      }
    })();
  }, [location.search]);

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
  };




const nextStep = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

const prevStep = async () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

// Auto-advancement handler
  const handleAutoAdvance = async () => {
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
              <div className="flex items-center gap-2">
                <span className="text-center sm:text-left">{Math.round(progress)}% تکمیل شده</span>
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Wizard;