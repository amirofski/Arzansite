import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { notificationsService } from '@/lib/services';
import { appwriteConfig } from '@/lib/appwrite';
import { environment } from '@/lib/config/environment';
import { 
  Bug, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Bell,
  Database
} from 'lucide-react';

export const DebugPanel: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { unseenCount, messages, loading: notificationsLoading } = useNotifications();
  const { preferences, loading: preferencesLoading } = useNotificationPreferences();
  const { isPolling, getStatus } = useNotificationPolling();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [pollingStatus, setPollingStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  // Check API connection
  const checkApiConnection = async () => {
    try {
      setApiStatus('checking');
      const response = await fetch(`${environment.api.baseUrl}/health`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      console.error('API connection check failed:', error);
      setApiStatus('offline');
    }
  };

  // Check Appwrite connection
  const checkAppwriteConnection = async () => {
    try {
      setConnectionStatus('checking');
      // Try to get account info
      const account = await import('@/lib/appwrite').then(m => m.account);
      const accountInfo = await account.get();
      
      if (accountInfo) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Appwrite connection check failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Check polling status
  const checkPollingStatus = () => {
    try {
      setPollingStatus('checking');
      const status = getStatus();
      setPollingStatus(status.isPolling ? 'active' : 'inactive');
    } catch (error) {
      console.error('Polling status check failed:', error);
      setPollingStatus('inactive');
    }
  };

  // Test notification sending
  const testNotification = async () => {
    try {
      const response = await notificationsService.sendTestNotification({
        title: 'تست دیباگ',
        message: 'این یک اعلان تستی از پنل دیباگ است',
        type: 'debug'
      });
      
      if (response.success) {
        console.log('Test notification sent successfully');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  // Run all checks on mount
  useEffect(() => {
    checkApiConnection();
    checkAppwriteConnection();
    checkPollingStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
      case 'offline':
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
        return 'متصل';
      case 'disconnected':
      case 'offline':
        return 'قطع';
      case 'active':
        return 'فعال';
      case 'inactive':
        return 'غیرفعال';
      case 'checking':
        return 'در حال بررسی';
      default:
        return 'نامشخص';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            پنل دیباگ سیستم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">API Server</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(apiStatus)}
                <span className="text-sm">{getStatusText(apiStatus)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Appwrite</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus)}
                <span className="text-sm">{getStatusText(connectionStatus)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Notification Polling</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(pollingStatus)}
                <span className="text-sm">{getStatusText(pollingStatus)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkApiConnection} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-1" />
              تست API
            </Button>
            <Button onClick={checkAppwriteConnection} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-1" />
              تست Appwrite
            </Button>
            <Button onClick={testNotification} variant="outline" size="sm">
              <Bell className="w-4 h-4 ml-1" />
              تست اعلان
            </Button>
          </div>

          {/* Configuration Info */}
          <div className="space-y-4">
            <h4 className="font-medium">تنظیمات سیستم</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">API Configuration</h5>
                <div className="text-xs space-y-1">
                  <div>Base URL: {environment.api.baseUrl}</div>
                  <div>Timeout: {environment.api.timeout}ms</div>
                  <div>Retry Attempts: {environment.api.retryAttempts}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Appwrite Configuration</h5>
                <div className="text-xs space-y-1">
                  <div>Endpoint: {appwriteConfig.endpoint}</div>
                  <div>Project ID: {appwriteConfig.projectId}</div>
                  <div>Database ID: {appwriteConfig.databaseId}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">Collections</h5>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(appwriteConfig.collections).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* User Status */}
          <div className="space-y-4">
            <h4 className="font-medium">وضعیت کاربر</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Authentication</h5>
                <div className="text-xs space-y-1">
                  <div>Status: {isAuthenticated ? 'وارد شده' : 'خارج شده'}</div>
                  <div>User ID: {user?.id || 'نامشخص'}</div>
                  <div>Email: {user?.email || 'نامشخص'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Notifications</h5>
                <div className="text-xs space-y-1">
                  <div>Unread Count: {unseenCount}</div>
                  <div>Total Messages: {messages.length}</div>
                  <div>Loading: {notificationsLoading ? 'بله' : 'خیر'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="space-y-4">
            <h4 className="font-medium">Feature Flags</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(environment.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-xs">{key}</span>
                  <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                    {value ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Environment Info */}
          <div className="space-y-4">
            <h4 className="font-medium">اطلاعات محیط</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Environment</h5>
                <div className="text-xs space-y-1">
                  <div>Mode: {environment.development.isDev ? 'Development' : 'Production'}</div>
                  <div>Debug Logging: {environment.features.enableDebugLogging ? 'فعال' : 'غیرفعال'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Browser</h5>
                <div className="text-xs space-y-1">
                  <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
                  <div>Online: {navigator.onLine ? 'بله' : 'خیر'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Timestamp</h5>
                <div className="text-xs space-y-1">
                  <div>Current Time: {new Date().toLocaleString('fa-IR')}</div>
                  <div>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
