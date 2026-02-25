import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/services';
import { RefreshCw, Search, AlertTriangle, Eye } from 'lucide-react';
import { AnimatedLoader } from '@/components/ui/AnimatedLoader';

interface PaymentLog {
  id: string;
  user_id: string;
  order_id?: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
  ref_id?: string;
  authority?: string;
  gateway_response?: string;
  metadata?: Record<string, unknown>;
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

const getStatusBadgeVariant = (status: string) => {
	switch (status) {
		case 'succeeded':
			return 'default';
		case 'pending':
			return 'secondary';
		case 'failed':
			return 'destructive';
		case 'refunded':
			return 'outline';
		case 'cancelled':
			return 'secondary';
		default:
			return 'secondary';
	}
};

const getStatusLabel = (status: string) => {
	switch (status) {
		case 'succeeded':
			return 'موفق';
		case 'pending':
			return 'در انتظار';
		case 'failed':
			return 'ناموفق';
		case 'refunded':
			return 'برگشت شده';
		case 'cancelled':
			return 'لغو شده';
		default:
			return status;
	}
};

const formatAmount = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : '—');

const AdminPaymentLogs: React.FC = () => {
	const { toast } = useToast();
	const [logs, setLogs] = useState<PaymentLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [from, setFrom] = useState<string>('');
	const [to, setTo] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(20);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	const toIsoOrEmpty = (value: string) => {
		if (!value) return '';
		try { return new Date(value).toISOString(); } catch { return ''; }
	};

	const load = async () => {
		setLoading(true);
		try {
			const params: any = {
				page,
				limit,
				from: toIsoOrEmpty(from),
				to: toIsoOrEmpty(to),
			};
			
			if (statusFilter !== 'all') {
				params.status = statusFilter;
			}
			
			const data = await adminService.getPayments(params);
			setLogs(Array.isArray(data.items) ? data.items : []);
			setTotalPages(data.pagination?.pages || 1);
		} catch (e) {
			toast({ 
				title: 'خطا در دریافت پرداخت‌ها', 
				description: 'مشکلی در دریافت اطلاعات پرداخت‌ها پیش آمد',
				variant: 'destructive' 
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit]);

	const duplicates = useMemo(() => {
		const map = new Map<string, PaymentLog[]>();
		logs.forEach((l) => {
			if (!l.ref_id) return;
			const arr = map.get(l.ref_id) || [];
			arr.push(l);
			map.set(l.ref_id, arr);
		});
		return Array.from(map.entries()).filter(([, arr]) => arr.length > 1);
	}, [logs]);

	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		if (!s) return logs;
		return logs.filter((l) => 
			(l.ref_id || '').toLowerCase().includes(s) || 
			(l.user_id || '').toLowerCase().includes(s) ||
			(l.userProfile?.email || '').toLowerCase().includes(s) ||
			(l.userProfile?.full_name || '').toLowerCase().includes(s) ||
			(l.order?.title || '').toLowerCase().includes(s)
		);
	}, [logs, search]);

	const handlePaymentDetails = (payment: PaymentLog) => {
		setSelectedPayment(payment);
		setShowDetails(true);
	};

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>لاگ پرداخت‌ها</CardTitle>
				<Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1">
					<RefreshCw className="w-4 h-4" />
					بروزرسانی
				</Button>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
						<Input placeholder="جستجو (RefId/کاربر/سفارش)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
					</div>
					<div>
						<label className="text-xs text-muted-foreground">وضعیت</label>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger>
								<SelectValue placeholder="انتخاب وضعیت" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">همه</SelectItem>
								<SelectItem value="succeeded">موفق</SelectItem>
								<SelectItem value="pending">در انتظار</SelectItem>
								<SelectItem value="failed">ناموفق</SelectItem>
								<SelectItem value="refunded">برگشت شده</SelectItem>
								<SelectItem value="cancelled">لغو شده</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-xs text-muted-foreground">از تاریخ</label>
						<Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
					</div>
					<div>
						<label className="text-xs text-muted-foreground">تا تاریخ</label>
						<Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
					</div>
					<div className="flex items-end gap-2">
						<Button variant="outline" size="sm" onClick={() => { setPage(1); load(); }} className="flex items-center gap-1">
							<RefreshCw className="w-4 h-4" />
							اعمال فیلتر
						</Button>
					</div>
				</div>

				{duplicates.length > 0 && (
					<div className="p-3 rounded border bg-yellow-50 text-yellow-900 flex items-center gap-2 mb-4 text-sm">
						<AlertTriangle className="w-4 h-4" />
						{duplicates.length} مورد RefId تکراری یافت شد
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<AnimatedLoader size="lg" variant="gradient2" />
					</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">تراکنشی یافت نشد</div>
				) : (
					<div className="space-y-3">
						{filtered.map((l) => (
							<div key={l.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">
											{l.userProfile?.full_name || l.userProfile?.email || `کاربر: ${l.user_id}`}
										</span>
										<Badge variant={getStatusBadgeVariant(l.status)}>
											{getStatusLabel(l.status)}
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										RefId: {l.ref_id || '—'} | Authority: {l.authority || '—'}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										تاریخ: {formatDate(l.created_at)}
										{l.order && ` | سفارش: ${l.order.title}`}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="font-medium whitespace-nowrap">{formatAmount(l.amount)}</div>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => handlePaymentDetails(l)}
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

				{/* Payment Details Dialog */}
				<Dialog open={showDetails} onOpenChange={setShowDetails}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>جزئیات پرداخت</DialogTitle>
					</DialogHeader>
					{selectedPayment && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">شناسه پرداخت</label>
									<p className="font-mono">{selectedPayment.id}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">وضعیت</label>
									<div className="mt-1">
										<Badge variant={getStatusBadgeVariant(selectedPayment.status)}>
											{getStatusLabel(selectedPayment.status)}
										</Badge>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">مبلغ</label>
									<p className="font-medium">{formatAmount(selectedPayment.amount)}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">کد پیگیری</label>
									<p className="font-mono">{selectedPayment.ref_id || '—'}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">Authority</label>
									<p className="font-mono text-sm">{selectedPayment.authority || '—'}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">تاریخ ایجاد</label>
									<p>{formatDate(selectedPayment.created_at)}</p>
								</div>
							</div>
							
							{selectedPayment.userProfile && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات کاربر</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">نام</label>
											<p>{selectedPayment.userProfile.full_name || '—'}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">ایمیل</label>
											<p>{selectedPayment.userProfile.email}</p>
										</div>
									</div>
								</div>
							)}
							
							{selectedPayment.order && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات سفارش</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">عنوان</label>
											<p>{selectedPayment.order.title}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">وضعیت سفارش</label>
											<p>{selectedPayment.order.status}</p>
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

export default AdminPaymentLogs;


