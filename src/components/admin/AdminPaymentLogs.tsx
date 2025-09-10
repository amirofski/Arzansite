import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/services';
import { RefreshCw, Search, AlertTriangle } from 'lucide-react';

type PaymentLog = { id: string; user_id: string; status: string; ref_id?: string; amount: number; created_at: string };

const statusBadge = (status: string) => {
	switch (status) {
		case 'completed':
		case 'paid':
			return 'bg-green-100 text-green-800';
		case 'failed':
			return 'bg-red-100 text-red-800';
		case 'pending':
			return 'bg-yellow-100 text-yellow-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
};

const formatAmount = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : '—');

const AdminPaymentLogs: React.FC = () => {
	const { toast } = useToast();
	const [logs, setLogs] = useState<PaymentLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');

	const load = async () => {
		setLoading(true);
		try {
			const data = await adminService.getPayments({ limit: 100 });
			setLogs(data.payments || []);
		} catch (e) {
			toast({ title: 'خطا در دریافت پرداخت‌ها', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
		return logs.filter((l) => (l.ref_id || '').toLowerCase().includes(s) || (l.user_id || '').toLowerCase().includes(s));
	}, [logs, search]);

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
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
					<Input placeholder="جستجو (RefId/کاربر)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
				</div>

				{duplicates.length > 0 && (
					<div className="p-3 rounded border bg-yellow-50 text-yellow-900 flex items-center gap-2 mb-4 text-sm">
						<AlertTriangle className="w-4 h-4" />
						{duplicates.length} مورد RefId تکراری یافت شد
					</div>
				)}

				{loading ? (
					<div className="text-center text-sm text-muted-foreground py-8">در حال بارگیری...</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">تراکنشی یافت نشد</div>
				) : (
					<div className="space-y-3">
						{filtered.map((l) => (
							<div key={l.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">کاربر: {l.user_id}</span>
										<Badge className={`${statusBadge(l.status)} border-0`}>{l.status}</Badge>
									</div>
									<div className="text-xs text-muted-foreground mt-1">RefId: {l.ref_id || '—'}</div>
									<div className="text-xs text-muted-foreground mt-1">تاریخ: {formatDate(l.created_at)}</div>
								</div>
								<div className="font-medium whitespace-nowrap">{formatAmount(l.amount)}</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default AdminPaymentLogs;


