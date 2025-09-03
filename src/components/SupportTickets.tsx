import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/lib/services';
import { supportService, type SupportTicket, type CreateTicketRequest } from '@/lib/services';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<Partial<CreateTicketRequest>>({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  const { execute: fetchTickets, loading: fetchLoading } = useApi(
    supportService.getTickets.bind(supportService),
    { onSuccess: (data) => setTickets(data.tickets || []) }
  );

  const { execute: createTicket, loading: createLoading } = useApi(
    supportService.createTicket.bind(supportService),
    { 
      onSuccess: () => {
        toast.success('تیکت پشتیبانی با موفقیت ایجاد شد');
        setCreateDialogOpen(false);
        setNewTicket({ subject: '', description: '', priority: 'medium', category: 'general' });
        fetchTickets();
      },
      onError: (error) => toast.error('خطا در ایجاد تیکت: ' + error.message)
    }
  );

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('لطفاً موضوع و توضیحات را پر کنید');
      return;
    }

    await createTicket(newTicket as CreateTicketRequest);
  };

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'باز';
      case 'in_progress': return 'در حال بررسی';
      case 'resolved': return 'حل شده';
      case 'closed': return 'بسته';
      default: return status;
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: SupportTicket['category']) => {
    switch (category) {
      case 'technical': return 'فنی';
      case 'billing': return 'مالی';
      case 'general': return 'عمومی';
      case 'feature_request': return 'درخواست ویژگی';
      case 'bug_report': return 'گزارش باگ';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">تیکت‌های پشتیبانی</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              تیکت جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ایجاد تیکت پشتیبانی جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">موضوع</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="موضوع تیکت را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">توضیحات</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات کامل مشکل یا درخواست خود را بنویسید"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اولویت</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">کم</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">بالا</SelectItem>
                      <SelectItem value="urgent">فوری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">دسته‌بندی</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عمومی</SelectItem>
                      <SelectItem value="technical">فنی</SelectItem>
                      <SelectItem value="billing">مالی</SelectItem>
                      <SelectItem value="feature_request">درخواست ویژگی</SelectItem>
                      <SelectItem value="bug_report">گزارش باگ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleCreateTicket} disabled={createLoading}>
                  {createLoading ? 'در حال ایجاد...' : 'ایجاد تیکت'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fetchLoading ? (
        <div className="text-center py-8">در حال بارگذاری...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">هیچ تیکت پشتیبانی‌ای وجود ندارد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <Badge variant="outline">{getStatusText(ticket.status)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex space-x-4">
                    <span>دسته‌بندی: {getCategoryText(ticket.category)}</span>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex space-x-4">
                    <span>تاریخ ایجاد: {formatDate(ticket.createdAt)}</span>
                    <span>پیام‌ها: {ticket.messages.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
