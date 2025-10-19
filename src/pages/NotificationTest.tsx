/**
 * Notification Test Page
 * A comprehensive testing page for the notification system
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationTestPanel } from '@/components/NotificationTestPanel';
import { NotificationStatus } from '@/components/NotificationStatus';
import { DebugPanel } from '@/components/DebugPanel';
import { OrderCreationTest } from '@/components/OrderCreationTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Bug, Settings, TestTube } from 'lucide-react';

export default function NotificationTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">تست سیستم اعلان‌ها</h1>
        <p className="text-muted-foreground">
          ابزارهای تست و دیباگ برای سیستم اعلان‌ها و polling
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            تست اعلان‌ها
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            تست سفارش‌ها
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            وضعیت سیستم
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            دیباگ
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            تنظیمات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <NotificationTestPanel />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <OrderCreationTest />
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NotificationStatus />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات Polling</CardTitle>
                <CardDescription>
                  جزئیات سیستم polling اعلان‌ها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نسخه Appwrite:</span>
                    <span>1.6.1 (سرور اختصاصی)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">روش دریافت:</span>
                    <span>Polling (هر 30 ثانیه)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Realtime:</span>
                    <span className="text-red-500">غیرفعال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MCP:</span>
                    <span className="text-green-500">فعال</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <DebugPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات سیستم اعلان‌ها</CardTitle>
              <CardDescription>
                پیکربندی سیستم اعلان‌ها و polling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  اطلاعات مهم
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• سیستم از Appwrite 1.6.1 استفاده می‌کند</li>
                  <li>• Realtime در این نسخه در client SDK موجود نیست</li>
                  <li>• از polling هر 30 ثانیه برای دریافت اعلان‌های جدید استفاده می‌شود</li>
                  <li>• تمام عملیات از طریق MCP انجام می‌شود</li>
                  <li>• سیستم خودکار اعلان‌های جدید را دریافت و نمایش می‌دهد</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  نکات عملکرد
                </h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Polling هر 30 ثانیه اجرا می‌شود</li>
                  <li>• در صورت عدم اتصال، سیستم خودکار تلاش می‌کند</li>
                  <li>• اعلان‌های جدید بلافاصله در UI نمایش داده می‌شوند</li>
                  <li>• سیستم فقط اعلان‌های کاربر فعلی را دریافت می‌کند</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
