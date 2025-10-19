/**
 * Notification Status Component
 * Shows the current status of the notification system
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { Bell, BellRing, BellOff, RefreshCw } from 'lucide-react';

export function NotificationStatus() {
  const { unseenCount, loading, error } = useNotifications();
  const { isPolling, getStatus } = useNotificationPolling();
  
  const pollingStatus = getStatus();

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error) return <BellOff className="h-4 w-4 text-red-500" />;
    if (isPolling) return <BellRing className="h-4 w-4 text-green-500" />;
    return <Bell className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (loading) return 'در حال بارگذاری...';
    if (error) return 'خطا در سیستم اعلان‌ها';
    if (isPolling) return 'سیستم اعلان‌ها فعال است';
    return 'سیستم اعلان‌ها غیرفعال است';
  };

  const getStatusVariant = () => {
    if (error) return 'destructive';
    if (isPolling) return 'default';
    return 'secondary';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          وضعیت اعلان‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">وضعیت:</span>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">اعلان‌های نخوانده:</span>
          <Badge variant={unseenCount > 0 ? "default" : "secondary"}>
            {unseenCount}
          </Badge>
        </div>
        
        {isPolling && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">فاصله بررسی:</span>
            <span className="text-sm text-muted-foreground">
              هر {pollingStatus.interval / 1000} ثانیه
            </span>
          </div>
        )}
        
        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
