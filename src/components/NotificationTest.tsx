import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { notificationsService } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { Bell, TestTube, Settings, Send } from 'lucide-react';

export const NotificationTest: React.FC = () => {
  const { unseenCount, messages, markAllRead, markAsRead, refresh } = useNotifications();
  const { preferences } = useNotificationPreferences();
  const { toast } = useToast();
  const [testMode, setTestMode] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const handleTestNotification = async () => {
    setSendingTest(true);
    try {
      const response = await notificationsService.sendTestNotification({
        title: 'تست اعلان',
        message: 'این یک اعلان تستی است که از فرانت‌اند ارسال شده است.',
        type: 'test'
      });
      
      if (response.success) {
        toast({
          title: 'اعلان تستی ارسال شد',
          description: 'اعلان تستی با موفقیت ارسال شد',
        });
        // Refresh notifications to show the new one
        await refresh();
      }
    } catch (error) {
      toast({
        title: 'خطا در ارسال اعلان تستی',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleOrderStatusNotification = async () => {
    setSendingTest(true);
    try {
      const response = await notificationsService.sendOrderStatusNotification({
        orderId: 'test-order-123',
        status: 'completed',
        message: 'سفارش شما با موفقیت تکمیل شد',
        notificationType: 'order_completed'
      });
      
      if (response.success) {
        toast({
          title: 'اعلان وضعیت سفارش ارسال شد',
          description: 'اعلان وضعیت سفارش با موفقیت ارسال شد',
        });
        await refresh();
      }
    } catch (error) {
      toast({
        title: 'خطا در ارسال اعلان وضعیت',
        description: error instanceof Error ? error.message : 'خطای نامشخص',
        variant: 'destructive',
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            تست سیستم اعلان‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Bell className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{unseenCount}</div>
              <div className="text-sm text-muted-foreground">اعلان‌های نخوانده</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{messages.length}</div>
              <div className="text-sm text-muted-foreground">کل اعلان‌ها</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Settings className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">
                {preferences.paymentReminders.monthly.enabled ? 'فعال' : 'غیرفعال'}
              </div>
              <div className="text-sm text-muted-foreground">یادآوری ماهانه</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleTestNotification} 
              variant="outline"
              disabled={sendingTest}
            >
              <TestTube className="w-4 h-4 ml-1" />
              {sendingTest ? 'در حال ارسال...' : 'تست اعلان'}
            </Button>
            <Button 
              onClick={handleOrderStatusNotification} 
              variant="outline"
              disabled={sendingTest}
            >
              <Send className="w-4 h-4 ml-1" />
              {sendingTest ? 'در حال ارسال...' : 'اعلان وضعیت سفارش'}
            </Button>
            <Button onClick={refresh} variant="outline">
              <Bell className="w-4 h-4 ml-1" />
              رفرش
            </Button>
            <Button onClick={markAllRead} variant="outline">
              علامت‌گذاری همه
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>آخرین اعلان‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ اعلانی وجود ندارد
            </div>
          ) : (
            <div className="space-y-2">
              {messages.slice(0, 5).map((message) => (
                <div 
                  key={message.id}
                  className={`p-3 rounded-lg border ${!message.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-muted/30'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{message.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{message.body}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(message.date).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    {!message.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(message.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        علامت‌گذاری
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Summary */}
      <Card>
        <CardHeader>
          <CardTitle>خلاصه تنظیمات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">اعلان‌های عمومی</h4>
              <div className="space-y-1 text-sm">
                <div>ایمیل: {preferences.email ? 'فعال' : 'غیرفعال'}</div>
                <div>پوش: {preferences.push ? 'فعال' : 'غیرفعال'}</div>
                <div>درون برنامه: {preferences.inApp ? 'فعال' : 'غیرفعال'}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">یادآوری پرداخت</h4>
              <div className="space-y-1 text-sm">
                <div>ماهانه: {preferences.paymentReminders.monthly.enabled ? 'فعال' : 'غیرفعال'}</div>
                <div>سالانه: {preferences.paymentReminders.annual.enabled ? 'فعال' : 'غیرفعال'}</div>
                <div className="text-xs text-muted-foreground">
                  ماهانه: {preferences.paymentReminders.monthly.days.join(', ')} روز قبل
                </div>
                <div className="text-xs text-muted-foreground">
                  سالانه: {preferences.paymentReminders.annual.days.join(', ')} روز قبل
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
