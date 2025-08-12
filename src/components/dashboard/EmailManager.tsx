import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { 
  Mail, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react';
import EmailTemplatePreview from '@/components/EmailTemplatePreview';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  success: boolean;
  error_message?: string;
  sent_at: string;
  service_used: string;
  template_type?: string;
  user_id?: string;
}

interface EmailStats {
  total_emails: number;
  successful_emails: number;
  failed_emails: number;
  success_rate: number;
  most_used_service: string;
  emails_by_template: Record<string, number>;
}

const EmailManager: React.FC = () => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { toast } = useToast();

  // Load email logs
  const loadEmailLogs = async () => {
    setLoading(true);
    try {
      // Fetch from backend endpoint (expects filters via query params if supported)
      // For now, fetch all and filter client-side
      const logs = await apiClient.getEmailLogs(200, 0);
      setEmailLogs(logs || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری لاگ‌های ایمیل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load email statistics
  const loadEmailStats = async () => {
    try {
      // If backend has a stats endpoint, call it; otherwise compute from logs
      const logs = await apiClient.getEmailLogs(200, 0);
      const stats = computeStatsFromLogs(logs || []);
      setEmailStats(stats);
    } catch (error) {
      console.error('Error loading email stats:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری آمار ایمیل",
        variant: "destructive"
      });
    }
  };

  // Filter email logs based on search term
  const filteredEmailLogs = emailLogs.filter(log => 
    log.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.template_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export email logs to CSV
  const exportToCSV = () => {
    const headers = ['تاریخ', 'ایمیل', 'موضوع', 'وضعیت', 'سرویس', 'قالب', 'خطا'];
    const csvContent = [
      headers.join(','),
      ...filteredEmailLogs.map(log => [
        new Date(log.sent_at).toLocaleString('fa-IR'),
        log.to_email,
        log.subject,
        log.success ? 'موفق' : 'ناموفق',
        log.service_used,
        log.template_type || '-',
        log.error_message || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `email-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Test email service
  const testEmailService = async () => {
    try {
      await apiClient.sendEmail({
        to: 'test@example.com',
        subject: 'تست سرویس ایمیل',
        template: 'custom',
        data: { html: '<h1>این یک ایمیل تست است</h1>' }
      });
      toast({ title: "موفقیت", description: "سرویس ایمیل به درستی کار می‌کند" });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تست سرویس ایمیل",
        variant: "destructive"
      });
    }
  };

  const computeStatsFromLogs = (logs: EmailLog[]): EmailStats => {
    const total = logs.length;
    const successful = logs.filter(l => l.success).length;
    const failed = total - successful;
    const successRate = total ? Math.round((successful / total) * 100) : 0;
    const byService: Record<string, number> = {};
    const byTemplate: Record<string, number> = {};
    logs.forEach(l => {
      byService[l.service_used] = (byService[l.service_used] || 0) + 1;
      const t = l.template_type || 'custom';
      byTemplate[t] = (byTemplate[t] || 0) + 1;
    });
    const mostUsedService = Object.entries(byService).sort((a,b) => b[1]-a[1])[0]?.[0] || '-';
    return {
      total_emails: total,
      successful_emails: successful,
      failed_emails: failed,
      success_rate: successRate,
      most_used_service: mostUsedService,
      emails_by_template: byTemplate,
    };
  };

  useEffect(() => {
    loadEmailLogs();
    loadEmailStats();
  }, [dateRange, statusFilter, serviceFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fa-IR');
  };

  const getStatusBadge = (success: boolean) => (
    <Badge variant={success ? "default" : "destructive"}>
      {success ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          موفق
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          ناموفق
        </>
      )}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت ایمیل</h2>
          <p className="text-muted-foreground">مدیریت و نظارت بر سیستم ایمیل</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadEmailLogs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            بروزرسانی
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            خروجی CSV
          </Button>
          <Button onClick={testEmailService} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            تست سرویس
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="logs">لاگ‌ها</TabsTrigger>
          <TabsTrigger value="templates">قالب‌ها</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل ایمیل‌ها</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emailStats?.total_emails || 0}</div>
                <p className="text-xs text-muted-foreground">
                  در {dateRange === '7d' ? '7 روز' : dateRange === '30d' ? '30 روز' : '90 روز'} گذشته
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">موفقیت</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emailStats?.successful_emails || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {emailStats?.success_rate || 0}% نرخ موفقیت
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ناموفق</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emailStats?.failed_emails || 0}</div>
                <p className="text-xs text-muted-foreground">
                  نیاز به بررسی
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سرویس اصلی</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emailStats?.most_used_service || '-'}</div>
                <p className="text-xs text-muted-foreground">
                  پراستفاده‌ترین سرویس
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Template Usage Chart */}
          {emailStats?.emails_by_template && (
            <Card>
              <CardHeader>
                <CardTitle>استفاده از قالب‌ها</CardTitle>
                <CardDescription>تعداد ایمیل‌های ارسال شده بر اساس نوع قالب</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(emailStats.emails_by_template).map(([template, count]) => (
                    <div key={template} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{template}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                فیلترها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>جستجو</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو در ایمیل‌ها..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>وضعیت</Label>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="success">موفق</SelectItem>
                      <SelectItem value="failed">ناموفق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>سرویس</Label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>بازه زمانی</Label>
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 روز گذشته</SelectItem>
                      <SelectItem value="30d">30 روز گذشته</SelectItem>
                      <SelectItem value="90d">90 روز گذشته</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>لاگ‌های ایمیل</CardTitle>
              <CardDescription>
                {filteredEmailLogs.length} ایمیل یافت شد
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>ایمیل</TableHead>
                        <TableHead>موضوع</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>سرویس</TableHead>
                        <TableHead>قالب</TableHead>
                        <TableHead>خطا</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmailLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.sent_at)}
                          </TableCell>
                          <TableCell>{log.to_email}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.subject}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.success)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.service_used}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.template_type ? (
                              <Badge variant="secondary">{log.template_type}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {log.error_message ? (
                              <span className="text-red-600 text-sm" title={log.error_message}>
                                {log.error_message.length > 50 
                                  ? log.error_message.substring(0, 50) + '...' 
                                  : log.error_message
                                }
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <EmailTemplatePreview />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات SMTP</CardTitle>
              <CardDescription>
                پیکربندی SMTP سفارشی برای ارسال ایمیل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input 
                    value="37-58-50-28.cprapid.com" 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input 
                    value="465" 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input 
                    value="info@arzansite.com" 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Security</Label>
                  <Input 
                    value="SSL" 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ایمیل فرستنده</Label>
                  <Input 
                    value="info@arzansite.com" 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ایمیل پشتیبانی</Label>
                  <Input 
                    value="support@arzansite.com" 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">نکات مهم:</h4>
                                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• تنظیمات SMTP در Supabase Dashboard قابل تغییر است</li>
                    <li>• برای تغییر تنظیمات به Settings → Auth → SMTP Settings مراجعه کنید</li>
                    <li>• تمام ایمیل‌ها از طریق SMTP سفارشی ارسال می‌شوند</li>
                    <li>• نیازی به سرویس‌های خارجی مانند Resend یا SendGrid نیست</li>
                  </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={testEmailService}>
                  <Mail className="w-4 h-4 mr-2" />
                  تست اتصال SMTP
                </Button>
                <Button variant="outline" disabled>
                  تنظیمات فقط در Supabase Dashboard قابل تغییر است
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailManager; 