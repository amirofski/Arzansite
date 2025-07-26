import React, { useState } from 'react';
import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import StepOne from '@/components/wizard/StepOne';
import DesignSelector from '@/components/wizard/DesignSelector';
import StepThree from '@/components/wizard/StepThree';
import PricingCalculator from '@/components/wizard/PricingCalculator';
import StepFive from '@/components/wizard/StepFive';
import OrderSubmissionStep from '@/components/wizard/OrderSubmissionStep';
import Layout from "@/components/ui/Layout";

interface WizardData {
  siteType: 'personal' | 'business' | '';
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
    selectedPackage: string;
    additionalServices: string[];
    customizationLevel: number[];
    rushDelivery: boolean;
    totalPrice: number;
  };
  userInfo: {
    name: string;
    email: string;
    domain: string;
  };
}

const Wizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    siteType: '',
    modules: [],
    branding: {
      primaryColor: '#8B5CF6',
      fontFamily: 'vazir',
      logo: ''
    },
    pricing: {
      selectedPackage: '',
      additionalServices: [],
      customizationLevel: [3],
      rushDelivery: false,
      totalPrice: 0
    },
    userInfo: {
      name: '',
      email: '',
      domain: ''
    }
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, title: 'نوع سایت', description: 'انتخاب نوع وب‌سایت' },
    { number: 2, title: 'طراحی', description: 'روش طراحی سایت' },
    { number: 3, title: 'برندینگ', description: 'طراحی و هویت بصری' },
    { number: 4, title: 'قیمت‌گذاری', description: 'محاسبه هزینه هوشمند' },
    { number: 5, title: 'اطلاعات', description: 'اطلاعات شخصی' },
    { number: 6, title: 'تأیید', description: 'تکمیل و ارسال سفارش' },
  ];

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne data={wizardData} updateData={updateWizardData} />;
      case 2:
        return <DesignSelector data={wizardData} updateData={updateWizardData} />;
      case 3:
        return <StepThree data={wizardData} updateData={updateWizardData} />;
      case 4:
        return <PricingCalculator data={wizardData} updateData={updateWizardData} />;
      case 5:
        return <StepFive data={wizardData} updateData={updateWizardData} />;
      case 6:
        return <OrderSubmissionStep data={wizardData} updateData={updateWizardData} />;
      default:
        return <StepOne data={wizardData} updateData={updateWizardData} />;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return wizardData.siteType !== '';
      case 2:
        return (wizardData.wireframe && wizardData.wireframe.pages && wizardData.wireframe.pages.length > 0) || 
               (wizardData.modules && wizardData.modules.length > 0);
      case 3:
        return wizardData.branding.primaryColor && wizardData.branding.fontFamily;
      case 4:
        return wizardData.pricing.selectedPackage !== '';
      case 5:
        return wizardData.userInfo.name && wizardData.userInfo.email && wizardData.userInfo.domain;
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
      <div className="min-h-screen bg-background py-8 mt-20">
        <div className="container mx-auto px-4">
          {/* Progress */}
          <div className="mb-8">
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>قدم {currentStep} از {totalSteps}</span>
              <span>{Math.round(progress)}% تکمیل شده</span>
            </div>
          </div>
          {/* Steps Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 space-x-reverse">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`step-indicator ${
                        currentStep === step.number
                          ? 'active'
                          : currentStep > step.number
                          ? 'completed'
                          : 'inactive'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium">{step.title}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-border mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Step Content */}
          <Card className="card-modern mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                {steps[currentStep - 1].title} - {steps[currentStep - 1].description}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="fade-in">
                {renderStep()}
              </div>
            </CardContent>
          </Card>
          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              قدم قبلی
            </Button>
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="btn-gradient flex items-center gap-2"
              >
                قدم بعدی
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                disabled={!isStepValid()}
                className="btn-gradient flex items-center gap-2"
              >
                تکمیل سفارش
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Wizard;