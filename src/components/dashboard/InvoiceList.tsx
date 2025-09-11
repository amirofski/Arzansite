import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { invoiceService, useApi, Invoice } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';
import { RefreshCw, FileText, Search } from 'lucide-react';

interface InvoiceListProps {
	autoRefreshMs?: number;
}

const statusBadge = (status: Invoice['status']) => {
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

const InvoiceList: React.FC<InvoiceListProps> = ({ autoRefreshMs = 30000 }) => {
	const { toast } = useToast();
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [search, setSearch] = useState('');
	const [payingId, setPayingId] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const { execute: fetchInvoices, loading: fetchLoading } = useApi(
		invoiceService.getInvoices.bind(invoiceService),
		{
			onSuccess: (data) => {
				// Handle both direct array and wrapped response
				if (Array.isArray(data)) {
					setInvoices(data);
				} else if (data && typeof data === 'object' && 'invoices' in data) {
					setInvoices(data.invoices || []);
				} else {
					console.warn('Unexpected invoice data structure:', data);
					setInvoices([]);
				}
			},
			onError: (error) => {
				console.error('Error loading invoices:', error);
				// Check if it's a missing collection error
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				if (errorMessage.includes('Collection with the requested ID could not be found') || 
					errorMessage.includes('AppwriteException')) {
					toast({ 
						title: 'سیستم در حال راه‌اندازی', 
						description: 'لطفاً چند لحظه صبر کنید تا سیستم فاکتورها آماده شود',
						variant: 'default'
					});
				} else {
					setLoadError('خطا در دریافت فاکتورها');
					toast({ title: 'خطا در دریافت فاکتورها', variant: 'destructive' });
				}
			}
		}
	);

	const { execute: payInvoice, loading: payLoading } = useApi(
		invoiceService.payInvoice.bind(invoiceService),
		{
			onSuccess: (res) => {
				if (res?.success) {
					toast({ title: 'فاکتور پرداخت شد' });
					load();
				} else {
					toast({ title: 'پرداخت ناموفق', variant: 'destructive' });
				}
				setPayingId(null);
			},
			onError: (error) => {
				toast({ title: 'خطا در پرداخت', variant: 'destructive' });
				setPayingId(null);
			}
		}
	);

	const load = async () => {
		// Wait for token presence to avoid unauthorized noise right after login
		let token = tokenManager.getAccessToken();
		if (!token) {
			tokenManager.forceRefreshFromStorage();
			token = tokenManager.getAccessToken();
			if (!token) {
				setLoading(false);
				return;
			}
		}
		setLoading(true);
		setLoadError(null);
		try {
			await fetchInvoices(statusFilter !== 'all' ? { status: statusFilter } : undefined);
		} catch (e: unknown) {
			console.error('Error loading invoices:', e);
			setLoadError('خطا در دریافت فاکتورها');
			toast({ title: 'خطا در دریافت فاکتورها', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [statusFilter]);

	useEffect(() => {
		if (!autoRefreshMs) return;
		const id = setInterval(load, autoRefreshMs);
		return () => clearInterval(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoRefreshMs, statusFilter]);

	const filtered = useMemo(() => {
		// Safety check to ensure invoices is an array
		if (!Array.isArray(invoices)) {
			console.warn('Invoices is not an array:', invoices);
			return [];
		}
		
		const s = search.trim().toLowerCase();
		if (!s) return invoices;
		return invoices.filter((inv) =>
			(inv.serviceName || '').toLowerCase().includes(s) || inv.id.toLowerCase().includes(s)
		);
	}, [invoices, search]);

	const payFromWallet = async (invoiceId: string) => {
		setPayingId(invoiceId);
		await payInvoice(invoiceId, { method: 'wallet', useWallet: true });
	};

	const payViaGateway = async (invoiceId: string) => {
		setPayingId(invoiceId);
		await payInvoice(invoiceId, { method: 'gateway' });
	};

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>فاکتورها</CardTitle>
				<Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1">
					<RefreshCw className="w-4 h-4" />
					بروزرسانی
				</Button>
			</CardHeader>
			<CardContent>
				{loadError && (
					<div className="p-3 mb-3 border border-destructive/30 bg-destructive/10 text-destructive rounded flex items-center justify-between">
						<div className="text-sm">{loadError}</div>
						<Button size="sm" variant="outline" onClick={load} className="ml-2">تلاش مجدد</Button>
					</div>
				)}
				<div className="flex flex-col sm:flex-row gap-3 mb-4">
					<Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
						<TabsList>
							<TabsTrigger value="all">همه</TabsTrigger>
							<TabsTrigger value="pending">در انتظار</TabsTrigger>
							<TabsTrigger value="due">سررسید</TabsTrigger>
							<TabsTrigger value="paid">پرداخت شده</TabsTrigger>
						</TabsList>
					</Tabs>
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
						<Input placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
					</div>
				</div>

				{loading || fetchLoading ? (
					<div className="text-center text-sm text-muted-foreground py-8">در حال بارگیری...</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">فاکتوری یافت نشد</div>
				) : (
					<div className="space-y-3">
						{filtered.map((inv) => (
							<div key={inv.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">{inv.serviceName || 'سرویس'}</span>
										<Badge className={`${statusBadge(inv.status)} border-0`}>{
											inv.status === 'paid' ? 'پرداخت شده' : inv.status === 'pending' ? 'در انتظار' : inv.status === 'overdue' || inv.status === 'due' ? 'سررسید' : 'لغو شده'
										}</Badge>
									</div>
									<div className="text-xs text-muted-foreground mt-1">شناسه: {inv.id}</div>
									<div className="text-xs text-muted-foreground mt-1">سررسید: {formatDate(inv.dueDate)}</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="font-medium whitespace-nowrap">{formatAmount(inv.amount)}</div>
									{inv.status !== 'paid' && (
										<div className="flex items-center gap-2">
											<Button size="sm" disabled={payingId === inv.id || payLoading} onClick={() => payFromWallet(inv.id)}>
												{payingId === inv.id || payLoading ? 'در حال پرداخت...' : 'پرداخت از کیف پول'}
											</Button>
											<Button size="sm" variant="outline" disabled={payingId === inv.id || payLoading} onClick={() => payViaGateway(inv.id)}>
												{payingId === inv.id || payLoading ? '...' : 'پرداخت درگاه'}
											</Button>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default InvoiceList;


