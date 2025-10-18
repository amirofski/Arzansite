import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Smartphone, Calendar, Save, Loader2 } from 'lucide-react';

export const NotificationPreferences: React.FC = () => {
  const { loading, error, preferences, updatePreferences } = useNotificationPreferences();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleUpdatePreferences = async (updates: Partial<typeof preferences>) => {
    setSaving(true);
    try {
      await updatePreferences(updates);
      toast({
        title: 'تنظیمات به‌روزرسانی شد',
        description: 'تنظیمات اعلان‌ها با موفقیت ذخیره شد',
      });
    } catch (error) {
      toast({
        title: 'خطا در به‌روزرسانی',
        description: 'خطا در ذخیره تنظیمات اعلان‌ها',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmail = (enabled: boolean) => {
    handleUpdatePreferences({ email: enabled });
  };

  const handleTogglePush = (enabled: boolean) => {
    handleUpdatePreferences({ push: enabled });
  };

  const handleToggleInApp = (enabled: boolean) => {
    handleUpdatePreferences({ inApp: enabled });
  };

  const handleTogglePaymentReminders = (cycle: 'monthly' | 'annual', enabled: boolean) => {
    const currentReminders = preferences.paymentReminders;
    handleUpdatePreferences({
      paymentReminders: {
        ...currentReminders,
        [cycle]: {
          ...currentReminders[cycle],
          enabled,
        },
      },
    });
  };

  const handleUpdateReminderDays = (cycle: 'monthly' | 'annual', days: number[]) => {
    const currentReminders = preferences.paymentReminders;
    handleUpdatePreferences({
      paymentReminders: {
        ...currentReminders,
        [cycle]: {
          ...currentReminders[cycle],
          days,
        },
      },
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="mr-2">در حال بارگذاری تنظیمات...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <p>خطا در بارگذاری تنظیمات: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      {/* General Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            تنظیمات عمومی اعلان‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <Label htmlFor="email-notifications">اعلان‌های ایمیل</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email}
              onCheckedChange={handleToggleEmail}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <Label htmlFor="push-notifications">اعلان‌های پوش</Label>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences.push}
              onCheckedChange={handleTogglePush}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <Label htmlFor="in-app-notifications">اعلان‌های درون برنامه</Label>
            </div>
            <Switch
              id="in-app-notifications"
              checked={preferences.inApp}
              onCheckedChange={handleToggleInApp}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            یادآوری پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monthly Reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">ماهانه</Badge>
                <Label>یادآوری پرداخت ماهانه</Label>
              </div>
              <Switch
                checked={preferences.paymentReminders.monthly.enabled}
                onCheckedChange={(enabled) => handleTogglePaymentReminders('monthly', enabled)}
                disabled={saving}
              />
            </div>
            
            {preferences.paymentReminders.monthly.enabled && (
              <div className="mr-6 space-y-2">
                <Label className="text-sm text-muted-foreground">
                  یادآوری در روزهای: {preferences.paymentReminders.monthly.days.join(', ')} قبل از سررسید
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 5, 7, 10, 15].map((day) => (
                    <Button
                      key={day}
                      variant={preferences.paymentReminders.monthly.days.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const currentDays = preferences.paymentReminders.monthly.days;
                        const newDays = currentDays.includes(day)
                          ? currentDays.filter(d => d !== day)
                          : [...currentDays, day].sort((a, b) => b - a);
                        handleUpdateReminderDays('monthly', newDays);
                      }}
                      disabled={saving}
                    >
                      {day} روز
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Annual Reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">سالانه</Badge>
                <Label>یادآوری پرداخت سالانه</Label>
              </div>
              <Switch
                checked={preferences.paymentReminders.annual.enabled}
                onCheckedChange={(enabled) => handleTogglePaymentReminders('annual', enabled)}
                disabled={saving}
              />
            </div>
            
            {preferences.paymentReminders.annual.enabled && (
              <div className="mr-6 space-y-2">
                <Label className="text-sm text-muted-foreground">
                  یادآوری در روزهای: {preferences.paymentReminders.annual.days.join(', ')} قبل از سررسید
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 3, 7, 15, 30, 45, 60].map((day) => (
                    <Button
                      key={day}
                      variant={preferences.paymentReminders.annual.days.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const currentDays = preferences.paymentReminders.annual.days;
                        const newDays = currentDays.includes(day)
                          ? currentDays.filter(d => d !== day)
                          : [...currentDays, day].sort((a, b) => b - a);
                        handleUpdateReminderDays('annual', newDays);
                      }}
                      disabled={saving}
                    >
                      {day} روز
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 پیشنهاد: برای پرداخت ماهانه 5، 2، 1 روز قبل از سررسید و برای سالانه 30، 7، 1 روز قبل از سررسید یادآوری کنید.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
