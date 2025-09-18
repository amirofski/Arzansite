import React from 'react';
import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/siteConfig";
import Layout from "@/components/ui/Layout";
import { WizardOrderExample } from '@/components/examples/WizardOrderExample';
import { WizardOrderManager } from '@/components/wizard/WizardOrderManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Test page for wizard integration components
 * This page demonstrates the new wizard service functionality
 */
const WizardTest = () => {
  // Mock wizard data for testing
  const mockWizardData = {
    siteType: 'personal' as const,
    websiteFramework: {
      dynamicDesign: {
        pages: [
          {
            id: 'main',
            name: 'صفحه اصلی',
            sections: [
              {
                id: 'header-1',
                sectionType: 'headers',
                layoutId: 'headers-1',
                order: 0,
                customData: { title: 'عنوان صفحه' }
              },
              {
                id: 'content-1',
                sectionType: 'content',
                layoutId: 'content-1',
                order: 1,
                customData: { content: 'محتوای صفحه' }
              },
              {
                id: 'footer-1',
                sectionType: 'footer',
                layoutId: 'footer-1',
                order: 2,
                customData: {}
              }
            ],
            canvasDimensions: {
              width: 1200,
              height: 800
            }
          }
        ],
        currentPageId: 'main'
      }
    },
    branding: {
      primaryColor: '#8B5CF6',
      fontFamily: 'vazir',
      logo: ''
    },
    pricing: {
      additionalServices: {
        socialMediaIntegration: true,
        seoOptimization: true,
        analyticsSetup: false,
        maintenancePlan: true,
        rushDelivery: false
      },
      customizationLevel: [3],
      rushDelivery: false,
      totalPrice: 2500000
    },
    userInfo: {
      domain: 'testwebsite',
      domainExtension: 'ir'
    }
  };


  return (
    <Layout>
      <Helmet>
        <title>تست ویزارد | {siteConfig.seo.defaultTitle}</title>
        <meta name="description" content="صفحه تست برای بررسی عملکرد ویزارد و سرویس‌های جدید" />
        <link rel="canonical" href={siteConfig.seo.siteUrl + '/wizard-test'} />
      </Helmet>
      
      <div className="min-h-screen bg-background mt-20 pt-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-4">تست ویزارد</h1>
            <p className="text-center text-muted-foreground">
              این صفحه برای تست عملکرد ویزارد و سرویس‌های جدید ایجاد شده است
            </p>
          </div>

          <Tabs defaultValue="example" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="example">مثال ساده</TabsTrigger>
              <TabsTrigger value="manager">مدیر سفارش</TabsTrigger>
              <TabsTrigger value="info">اطلاعات</TabsTrigger>
            </TabsList>

            <TabsContent value="example" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">مثال</Badge>
                    کامپوننت مثال ساده
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WizardOrderExample />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manager" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="default">مدیر</Badge>
                    کامپوننت مدیریت سفارش پیشرفته
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WizardOrderManager
                    wizardData={mockWizardData}
                    onOrderComplete={(orderId) => {
                      console.log('Order completed:', orderId);
                      alert(`سفارش با موفقیت ایجاد شد: ${orderId}`);
                    }}
                    onOrderSaved={(orderId) => {
                      console.log('Order saved for later:', orderId);
                      alert(`سفارش برای بعد ذخیره شد: ${orderId}`);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">اطلاعات</Badge>
                    جزئیات پیاده‌سازی
                  </CardTitle>
                </CardContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">سرویس‌های پیاده‌سازی شده</h3>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✅ WizardService - سرویس اصلی ویزارد</li>
                        <li>✅ completeOrder - تکمیل سفارش</li>
                        <li>✅ saveOrderForLater - ذخیره برای بعد</li>
                        <li>✅ saveProgress - ذخیره پیشرفت</li>
                        <li>✅ loadProgress - بارگذاری پیشرفت</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">کامپوننت‌های جدید</h3>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✅ WizardOrderExample - مثال ساده</li>
                        <li>✅ WizardOrderManager - مدیریت پیشرفته</li>
                        <li>✅ OrderSubmissionStep - مرحله نهایی</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">نکات مهم</h3>
                    <div className="text-sm space-y-2 text-muted-foreground">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p><strong>احراز هویت:</strong> برای استفاده از سرویس‌ها، کاربر باید وارد سیستم باشد</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p><strong>پرداخت:</strong> کاربران می‌توانند سفارش را تکمیل کنند یا برای بعد ذخیره کنند</p>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p><strong>پیشرفت:</strong> پیشرفت ویزارد به صورت خودکار ذخیره می‌شود</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">API Endpoints</h3>
                    <div className="text-sm space-y-1 text-muted-foreground font-mono">
                      <div>POST /api/wizard/complete-order</div>
                      <div>POST /api/wizard/save-order</div>
                      <div className="line-through opacity-70">POST /api/wizard/save-progress (deprecated)</div>
                      <div className="line-through opacity-70">GET /api/wizard/load-progress/:sessionId (deprecated)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default WizardTest;
