import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  getEmailTemplate, 
  prepareEmailData, 
  EmailTemplateData 
} from '@/lib/emailTemplates';
import { emailService } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { Mail, Eye, Send, Download, Copy } from 'lucide-react';

interface EmailTemplatePreviewProps {
  className?: string;
}

const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({ className }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'welcome' | 'verification' | 'password-reset' | 'password-reset-confirmation' | 'login-notification' | 'role-notification' | 'deactivation'>('welcome');
  const [templateData, setTemplateData] = useState<Partial<EmailTemplateData>>({
    userName: 'احمد محمدی',
    userEmail: 'ahmad@example.com',
    actionUrl: 'https://arzansite.com/verify?token=abc123',
    expirationTime: '24 ساعت',
    loginTime: '۱۴۰۲/۰۵/۱۵ ساعت ۱۴:۳۰',
    loginLocation: 'تهران، ایران',
    browserInfo: 'Google Chrome',
    newRole: 'admin',
    deactivationReason: 'نقض قوانین استفاده از سرویس'
  });
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const templateOptions = [
    { value: 'welcome', label: 'ایمیل خوش‌آمدگویی', icon: '👋' },
    { value: 'verification', label: 'تایید ایمیل', icon: '📧' },
    { value: 'password-reset', label: 'بازنشانی رمز عبور', icon: '🔐' },
    { value: 'password-reset-confirmation', label: 'تایید بازنشانی رمز عبور', icon: '✅' },
    { value: 'login-notification', label: 'اعلان ورود', icon: '🔔' },
    { value: 'role-notification', label: 'اعلان تغییر نقش', icon: '👑' },
    { value: 'deactivation', label: 'غیرفعال‌سازی حساب', icon: '⚠️' }
  ];

  // Generate preview
  const generatePreview = () => {
    try {
      const data = prepareEmailData(templateData);
      const html = getEmailTemplate(selectedTemplate, data);
      setPreviewHtml(html);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "خطا",
        description: "خطا در ایجاد پیش‌نمایش قالب",
        variant: "destructive"
      });
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!templateData.userEmail) {
      toast({
        title: "خطا",
        description: "لطفاً آدرس ایمیل را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailService.sendTemplateEmail({
        to: templateData.userEmail,
        subject: '',
        templateType: selectedTemplate,
        templateData
      });

      if (result.success) {
        toast({
          title: "موفقیت",
          description: "ایمیل تست با موفقیت ارسال شد"
        });
      } else {
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ارسال ایمیل تست",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download HTML
  const downloadHtml = () => {
    if (!previewHtml) return;
    
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-template-${selectedTemplate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy HTML to clipboard
  const copyHtml = async () => {
    if (!previewHtml) return;
    
    try {
      await navigator.clipboard.writeText(previewHtml);
      toast({
        title: "کپی شد",
        description: "HTML قالب در کلیپ‌بورد کپی شد"
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در کپی کردن HTML",
        variant: "destructive"
      });
    }
  };

  // Update template data
  const updateTemplateData = (field: keyof EmailTemplateData, value: string) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            پیش‌نمایش قالب‌های ایمیل
          </CardTitle>
          <CardDescription>
            قالب‌های ایمیل را مشاهده و تست کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">پیش‌نمایش</TabsTrigger>
              <TabsTrigger value="data">داده‌ها</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {templateOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedTemplate === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTemplate(option.value as any)}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={generatePreview} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  ایجاد پیش‌نمایش
                </Button>
                <Button 
                  onClick={sendTestEmail} 
                  disabled={isLoading || !templateData.userEmail}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? 'در حال ارسال...' : 'ارسال تست'}
                </Button>
                <Button onClick={downloadHtml} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  دانلود HTML
                </Button>
                <Button onClick={copyHtml} variant="outline" className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  کپی HTML
                </Button>
              </div>

              {previewHtml && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b">
                    <Badge variant="secondary">
                      پیش‌نمایش: {templateOptions.find(t => t.value === selectedTemplate)?.label}
                    </Badge>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-96 border-0"
                      title="Email Template Preview"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">نام کاربر</Label>
                  <Input
                    id="userName"
                    value={templateData.userName || ''}
                    onChange={(e) => updateTemplateData('userName', e.target.value)}
                    placeholder="نام کاربر"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">ایمیل کاربر</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={templateData.userEmail || ''}
                    onChange={(e) => updateTemplateData('userEmail', e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl">لینک عملیات</Label>
                  <Input
                    id="actionUrl"
                    value={templateData.actionUrl || ''}
                    onChange={(e) => updateTemplateData('actionUrl', e.target.value)}
                    placeholder="https://example.com/action"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationTime">زمان انقضا</Label>
                  <Input
                    id="expirationTime"
                    value={templateData.expirationTime || ''}
                    onChange={(e) => updateTemplateData('expirationTime', e.target.value)}
                    placeholder="24 ساعت"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginTime">زمان ورود</Label>
                  <Input
                    id="loginTime"
                    value={templateData.loginTime || ''}
                    onChange={(e) => updateTemplateData('loginTime', e.target.value)}
                    placeholder="۱۴۰۲/۰۵/۱۵ ساعت ۱۴:۳۰"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginLocation">مکان ورود</Label>
                  <Input
                    id="loginLocation"
                    value={templateData.loginLocation || ''}
                    onChange={(e) => updateTemplateData('loginLocation', e.target.value)}
                    placeholder="تهران، ایران"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="browserInfo">اطلاعات مرورگر</Label>
                  <Input
                    id="browserInfo"
                    value={templateData.browserInfo || ''}
                    onChange={(e) => updateTemplateData('browserInfo', e.target.value)}
                    placeholder="Google Chrome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newRole">نقش جدید</Label>
                  <Select
                    value={templateData.newRole || ''}
                    onValueChange={(value) => updateTemplateData('newRole', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نقش" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">کاربر</SelectItem>
                      <SelectItem value="admin">مدیر</SelectItem>
                      <SelectItem value="moderator">ناظر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deactivationReason">دلیل غیرفعال‌سازی</Label>
                <Textarea
                  id="deactivationReason"
                  value={templateData.deactivationReason || ''}
                  onChange={(e) => updateTemplateData('deactivationReason', e.target.value)}
                  placeholder="دلیل غیرفعال‌سازی حساب کاربری"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              {previewHtml ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>HTML قالب</Label>
                    <Button onClick={copyHtml} size="sm" variant="outline">
                      <Copy className="w-4 h-4 mr-1" />
                      کپی
                    </Button>
                  </div>
                  <Textarea
                    value={previewHtml}
                    readOnly
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  ابتدا پیش‌نمایش قالب را ایجاد کنید
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplatePreview; 