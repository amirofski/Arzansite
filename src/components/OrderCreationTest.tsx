/**
 * Order Creation Test Component
 * Tests the order creation flow with proper response parsing
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ordersService } from '@/lib/services/orders/ordersService';
import { useAuth } from '@/hooks/useAuth';
import { debugLog, errorLog } from '@/lib/config/environment';

export function OrderCreationTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testOrderCreation = async () => {
    if (!user?.id) {
      setError('کاربر وارد نشده است');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const testData = {
        submitMode: 'payment' as const,
        wizardData: {
          websiteFramework: {
            dynamicDesign: {
              pages: [{
                id: 'main',
                name: 'صفحه اصلی',
                sections: [{
                  id: 'headers-1760812721993',
                  sectionType: 'headers',
                  layoutId: 'headers-1',
                  order: 0,
                  customData: {}
                }],
                canvasDimensions: { width: 1200, height: 800 }
              }],
              currentPageId: 'main'
            }
          },
          branding: {
            primaryColor: '#8B5CF6',
            fontFamily: 'vazir',
            logo: ''
          },
          additionalServices: {},
          additionalServicesList: [],
          domains: {
            primaryDomain: 'test',
            domainExtension: 'ir',
            additionalDomains: []
          },
          pricing: {
            additionalServices: {},
            additionalServicesList: [],
            customizationLevel: [3],
            rushDelivery: false,
            totalPrice: 2500000
          }
        },
        totalAmount: 2500000,
        currency: 'IRR',
        title: 'وب‌سایت تست - test',
        description: 'پروژه تست برای بررسی order creation',
        comments: 'تست order creation',
        siteType: 'personal',
        paymentCycle: 'monthly' as const
      };

      debugLog('Testing order creation with data:', testData);

      const response = await ordersService.createOrderUnified(testData);
      
      setResult({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });

      debugLog('Order creation test successful:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ایجاد سفارش';
      setError(errorMessage);
      errorLog('Order creation test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testDraftCreation = async () => {
    if (!user?.id) {
      setError('کاربر وارد نشده است');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const testData = {
        submitMode: 'draft' as const,
        wizardData: {
          websiteFramework: {
            dynamicDesign: {
              pages: [{
                id: 'main',
                name: 'صفحه اصلی',
                sections: [{
                  id: 'headers-1760812721993',
                  sectionType: 'headers',
                  layoutId: 'headers-1',
                  order: 0,
                  customData: {}
                }],
                canvasDimensions: { width: 1200, height: 800 }
              }],
              currentPageId: 'main'
            }
          },
          branding: {
            primaryColor: '#8B5CF6',
            fontFamily: 'vazir',
            logo: ''
          }
        },
        totalAmount: 2500000,
        currency: 'IRR',
        title: 'پیش‌نویس تست - test',
        description: 'تست ایجاد پیش‌نویس',
        comments: 'تست draft creation',
        siteType: 'personal',
        paymentCycle: 'monthly' as const
      };

      debugLog('Testing draft creation with data:', testData);

      const response = await ordersService.createOrderUnified(testData);
      
      setResult({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      });

      debugLog('Draft creation test successful:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ایجاد پیش‌نویس';
      setError(errorMessage);
      errorLog('Draft creation test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>تست ایجاد سفارش</CardTitle>
        <CardDescription>
          تست کامل فرآیند ایجاد سفارش و پردازش response
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">کاربر:</span>
          <Badge variant={user ? "default" : "destructive"}>
            {user ? user.email : 'وارد نشده'}
          </Badge>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={testOrderCreation}
            disabled={loading || !user}
            size="sm"
          >
            {loading ? 'در حال تست...' : 'تست ایجاد سفارش (Payment)'}
          </Button>
          
          <Button 
            onClick={testDraftCreation}
            disabled={loading || !user}
            size="sm"
            variant="outline"
          >
            {loading ? 'در حال تست...' : 'تست ایجاد پیش‌نویس (Draft)'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-3">
            <Separator />
            
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                نتیجه تست:
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">وضعیت:</span>
                  <Badge variant="default" className="text-xs">
                    موفق
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Order ID:</span>
                  <span className="font-mono text-xs">
                    {result.data?.orderId || 'نامشخص'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Status:</span>
                  <span className="text-xs">
                    {result.data?.status || 'نامشخص'}
                  </span>
                </div>
                {result.data?.payment && (
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Payment:</span>
                    <span className="text-xs">
                      {result.data.payment.redirectUrl ? 'آماده' : 'نامشخص'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border rounded-md">
              <h5 className="text-sm font-medium mb-2">Response کامل:</h5>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-40">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
