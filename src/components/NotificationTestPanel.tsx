/**
 * Notification Test Panel
 * A comprehensive testing component for the notification system
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { notificationsService } from '@/lib/services/notifications/notificationsService';
import { useAuth } from '@/hooks/useAuth';
import { debugLog, errorLog } from '@/lib/config/environment';

export function NotificationTestPanel() {
  const { user } = useAuth();
  const { 
    loading, 
    error, 
    unseenCount, 
    notifications, 
    markAllRead, 
    markAsRead, 
    refresh 
  } = useNotifications();
  
  const { 
    startPolling, 
    stopPolling, 
    resetPolling, 
    getStatus, 
    isPolling 
  } = useNotificationPolling();
  
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  const handleSendTestNotification = async () => {
    if (!user?.id) {
      setTestError('کاربر وارد نشده است');
      return;
    }

    setTestLoading(true);
    setTestError(null);

    try {
      const result = await notificationsService.sendTestNotification({
        userId: user.id,
        title: 'تست اعلان',
        message: 'این یک اعلان تست است',
        type: 'test',
        data: {
          testId: Date.now(),
          timestamp: new Date().toISOString(),
        }
      });

      setLastTestResult(result);
      debugLog('Test notification sent successfully', result);
      
      // Refresh notifications to show the new one
      await refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ارسال اعلان تست';
      setTestError(errorMessage);
      errorLog('Failed to send test notification', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendOrderStatusNotification = async () => {
    if (!user?.id) {
      setTestError('کاربر وارد نشده است');
      return;
    }

    setTestLoading(true);
    setTestError(null);

    try {
      const result = await notificationsService.sendOrderStatusNotification({
        userId: user.id,
        orderId: `test_order_${Date.now()}`,
        status: 'completed',
        message: 'سفارش شما با موفقیت تکمیل شد'
      });

      setLastTestResult(result);
      debugLog('Order status notification sent successfully', result);
      
      // Refresh notifications to show the new one
      await refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ارسال اعلان وضعیت سفارش';
      setTestError(errorMessage);
      errorLog('Failed to send order status notification', error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleGetChannelStatus = async () => {
    setTestLoading(true);
    setTestError(null);

    try {
      const result = await notificationsService.getChannelStatus();
      setLastTestResult(result);
      debugLog('Channel status retrieved', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت وضعیت کانال‌ها';
      setTestError(errorMessage);
      errorLog('Failed to get channel status', error);
    } finally {
      setTestLoading(false);
    }
  };

  const pollingStatus = getStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تست سیستم اعلان‌ها</CardTitle>
          <CardDescription>
            ابزارهای تست و دیباگ برای سیستم اعلان‌ها
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

          {/* Polling Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">وضعیت Polling:</span>
            <Badge variant={isPolling ? "default" : "secondary"}>
              {isPolling ? 'فعال' : 'غیرفعال'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              (هر {pollingStatus.interval / 1000} ثانیه)
            </span>
          </div>

          {/* Notification Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{unseenCount}</div>
              <div className="text-sm text-muted-foreground">اعلان‌های نخوانده</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{notifications.length}</div>
              <div className="text-sm text-muted-foreground">کل اعلان‌ها</div>
            </div>
          </div>

          <Separator />

          {/* Test Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">عملیات تست</h4>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleSendTestNotification}
                disabled={testLoading || !user}
                size="sm"
              >
                {testLoading ? 'در حال ارسال...' : 'ارسال اعلان تست'}
              </Button>
              
              <Button 
                onClick={handleSendOrderStatusNotification}
                disabled={testLoading || !user}
                size="sm"
                variant="outline"
              >
                {testLoading ? 'در حال ارسال...' : 'اعلان وضعیت سفارش'}
              </Button>
              
              <Button 
                onClick={handleGetChannelStatus}
                disabled={testLoading}
                size="sm"
                variant="outline"
              >
                {testLoading ? 'در حال دریافت...' : 'وضعیت کانال‌ها'}
              </Button>
              
              <Button 
                onClick={refresh}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? 'در حال بارگذاری...' : 'تازه‌سازی'}
              </Button>
            </div>
          </div>

          {/* Polling Controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">کنترل Polling</h4>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={startPolling}
                disabled={isPolling || !user}
                size="sm"
                variant="outline"
              >
                شروع Polling
              </Button>
              
              <Button 
                onClick={stopPolling}
                disabled={!isPolling}
                size="sm"
                variant="outline"
              >
                توقف Polling
              </Button>
              
              <Button 
                onClick={resetPolling}
                disabled={!user}
                size="sm"
                variant="outline"
              >
                ریست Polling
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {(error || testError) && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || testError}
              </p>
            </div>
          )}

          {/* Last Test Result */}
          {lastTestResult && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                نتیجه آخرین تست:
              </h5>
              <pre className="text-xs text-green-700 dark:text-green-300 overflow-auto">
                {JSON.stringify(lastTestResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>اعلان‌های اخیر</CardTitle>
          <CardDescription>
            {notifications.length} اعلان موجود
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">اعلانی موجود نیست</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-md border ${
                    notification.isRead 
                      ? 'bg-gray-50 dark:bg-gray-900/50' 
                      : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium">{notification.title}</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString('fa-IR')}
                        </span>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            جدید
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => markAsRead(notification.id)}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                    >
                      علامت‌گذاری
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
