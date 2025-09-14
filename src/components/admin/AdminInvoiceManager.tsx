import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/services';
import { RefreshCw, Search } from 'lucide-react';

type AdminInvoice = {
  id: string;
  service_name?: string;
  user_id: string;
  status: string;
  due_date?: string;
  amount: number;
  created_at: string;
};

const statusBadge = (status: AdminInvoice['status']) => {
	switch (status) {
		case 'paid': return 'bg-green-100 text-green-800';
		case 'pending': return 'bg-yellow-100 text-yellow-800';
		case 'due':
		case 'overdue':
			return 'bg-red-100 text-red-800';
		case 'cancelled': return 'bg-gray-100 text-gray-800';
		default: return 'bg-gray-100 text-gray-800';
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
			setInvoices(data.items || []);
			setTotalPages(data.pagination?.pages || 1);
		} catch (e) {
			toast({ title: 'خطا در دریافت فاکتورها', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [statusFilter, page, limit]);

	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		if (!s) return invoices;
		return invoices.filter((inv) =>
			(inv.service_name || '').toLowerCase().includes(s) || (inv.user_id || '').toLowerCase().includes(s) || inv.id.toLowerCase().includes(s)
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
					<div className="text-center text-sm text-muted-foreground py-8">در حال بارگیری...</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">فاکتوری یافت نشد</div>
				) : (
					<div className="space-y-3">
						{filtered.map((inv) => (
							<div key={inv.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">{inv.service_name || 'سرویس'}</span>
										<Badge className={`${statusBadge(inv.status)} border-0`}>
											{inv.status === 'paid' ? 'پرداخت شده' : inv.status === 'pending' ? 'در انتظار' : inv.status === 'overdue' || inv.status === 'due' ? 'سررسید' : 'لغو شده'}
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground mt-1">کاربر: {inv.user_id}</div>
									<div className="text-xs text-muted-foreground mt-1">سررسید: {formatDate(inv.due_date)}</div>
								</div>
								<div className="font-medium whitespace-nowrap">{formatAmount(inv.amount)}</div>
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
			</Card>
	);
};

export default AdminInvoiceManager;


