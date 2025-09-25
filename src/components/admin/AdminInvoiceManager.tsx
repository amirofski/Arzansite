import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/services';
import { RefreshCw, Search, Eye, AlertCircle } from 'lucide-react';
import { AnimatedLoader } from '@/components/ui/AnimatedLoader';

interface AdminInvoice {
  $id: string;
  user_id: string;
  order_id?: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'due' | 'overdue' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;
  userProfile?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  order?: {
    id: string;
    title: string;
    status: string;
  };
}

const getStatusBadgeVariant = (status: AdminInvoice['status']) => {
	switch (status) {
		case 'paid': return 'default';
		case 'pending': return 'secondary';
		case 'due':
		case 'overdue':
			return 'destructive';
		case 'cancelled': return 'outline';
		default: return 'secondary';
	}
};

const getStatusLabel = (status: AdminInvoice['status']) => {
	switch (status) {
		case 'paid': return 'پرداخت شده';
		case 'pending': return 'در انتظار';
		case 'due': return 'سررسید';
		case 'overdue': return 'سررسید گذشته';
		case 'cancelled': return 'لغو شده';
		default: return status;
	}
};

const formatAmount = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : '—');

const AdminInvoiceManager: React.FC = () => {
	const { toast } = useToast();
	const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [search, setSearch] = useState('');
	const [from, setFrom] = useState<string>('');
	const [to, setTo] = useState<string>('');
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(20);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	const toIsoOrEmpty = (value: string) => {
		if (!value) return '';
		try { return new Date(value).toISOString(); } catch { return ''; }
	};

	const load = async () => {
		setLoading(true);
		try {
			const params: any = { page, limit };
			if (statusFilter !== 'all') params.status = statusFilter;
			if (from) params.from = toIsoOrEmpty(from);
			if (to) params.to = toIsoOrEmpty(to);
			const data = await adminService.getInvoices(params);
			setInvoices(Array.isArray(data.items) ? data.items : []);
			setTotalPages(data.pagination?.pages || 1);
		} catch (e) {
			toast({ 
				title: 'خطا در دریافت فاکتورها', 
				description: 'مشکلی در دریافت اطلاعات فاکتورها پیش آمد',
				variant: 'destructive' 
			});
		} finally {
			setLoading(false);
		}
	};

	const handleInvoiceDetails = (invoice: AdminInvoice) => {
		setSelectedInvoice(invoice);
		setShowDetails(true);
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [statusFilter, page, limit]);

	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		if (!s) return invoices;
		return invoices.filter((inv) =>
			(inv.description || '').toLowerCase().includes(s) || 
			(inv.user_id || '').toLowerCase().includes(s) || 
			(inv.userProfile?.email || '').toLowerCase().includes(s) ||
			(inv.userProfile?.full_name || '').toLowerCase().includes(s) ||
			(inv.order?.title || '').toLowerCase().includes(s) ||
			inv.$id.toLowerCase().includes(s)
		);
	}, [invoices, search]);

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>مدیریت فاکتورها</CardTitle>
				<Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1">
					<RefreshCw className="w-4 h-4" />
					بروزرسانی
				</Button>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4">
					<div className="sm:col-span-2">
						<Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
							<TabsList>
								<TabsTrigger value="all">همه</TabsTrigger>
								<TabsTrigger value="pending">در انتظار</TabsTrigger>
								<TabsTrigger value="due">سررسید</TabsTrigger>
								<TabsTrigger value="paid">پرداخت شده</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
						<Input placeholder="جستجو (کاربر/سرویس/شناسه)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
					</div>
					<div>
						<label className="text-xs text-muted-foreground">از تاریخ</label>
						<Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
					</div>
					<div>
						<label className="text-xs text-muted-foreground">تا تاریخ</label>
						<Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
					</div>
					<div className="flex items-end">
						<Button variant="outline" size="sm" onClick={() => { setPage(1); load(); }} className="flex items-center gap-1">
							<RefreshCw className="w-4 h-4" />
							اعمال فیلتر
						</Button>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<AnimatedLoader size="lg" variant="gradient2" />
					</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">
						<div className="flex flex-col items-center gap-2">
							<AlertCircle className="h-8 w-8 text-muted-foreground" />
							<p>فاکتوری یافت نشد</p>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						{filtered.map((inv) => (
							<div key={inv.$id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">
											{inv.description || inv.order?.title || 'فاکتور'}
										</span>
										<Badge variant={getStatusBadgeVariant(inv.status)}>
											{getStatusLabel(inv.status)}
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										کاربر: {inv.userProfile?.full_name || inv.userProfile?.email || inv.user_id}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										سررسید: {formatDate(inv.due_date)}
										{inv.order && ` | سفارش: ${inv.order.title}`}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="font-medium whitespace-nowrap">{formatAmount(inv.amount)}</div>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => handleInvoiceDetails(inv)}
									>
										<Eye className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
				<div className="flex items-center justify-between mt-4">
					<div className="text-xs text-muted-foreground">صفحه {page} از {totalPages}</div>
					<div className="flex gap-2">
						<Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>قبلی</Button>
						<Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
					</div>
				</div>
				</CardContent>

				{/* Invoice Details Dialog */}
				<Dialog open={showDetails} onOpenChange={setShowDetails}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>جزئیات فاکتور</DialogTitle>
					</DialogHeader>
					{selectedInvoice && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">شناسه فاکتور</label>
									<p className="font-mono">{selectedInvoice.$id}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">وضعیت</label>
									<div className="mt-1">
										<Badge variant={getStatusBadgeVariant(selectedInvoice.status)}>
											{getStatusLabel(selectedInvoice.status)}
										</Badge>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">مبلغ</label>
									<p className="font-medium">{formatAmount(selectedInvoice.amount)}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">تاریخ سررسید</label>
									<p>{formatDate(selectedInvoice.due_date)}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">تاریخ ایجاد</label>
									<p>{formatDate(selectedInvoice.created_at)}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">تاریخ بروزرسانی</label>
									<p>{formatDate(selectedInvoice.updated_at)}</p>
								</div>
							</div>
							
							{selectedInvoice.description && (
								<div>
									<label className="text-sm font-medium text-muted-foreground">توضیحات</label>
									<p className="mt-1">{selectedInvoice.description}</p>
								</div>
							)}
							
							{selectedInvoice.userProfile && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات کاربر</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">نام</label>
											<p>{selectedInvoice.userProfile.full_name || '—'}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">ایمیل</label>
											<p>{selectedInvoice.userProfile.email}</p>
										</div>
									</div>
								</div>
							)}
							
							{selectedInvoice.order && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات سفارش</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">عنوان</label>
											<p>{selectedInvoice.order.title}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">وضعیت سفارش</label>
											<p>{selectedInvoice.order.status}</p>
										</div>
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
			</Card>
		);
};

export default AdminInvoiceManager;


