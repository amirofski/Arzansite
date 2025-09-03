import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/services';
import { Download, RefreshCw, Search, FileText } from 'lucide-react';

type AdminReceipt = {
  id: string;
  service?: string;
  user_id: string;
  ref_id?: string;
  amount: number;
  created_at: string;
};

const formatAmount = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : '—');

const AdminReceiptManager: React.FC = () => {
	const { toast } = useToast();
	const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [downloading, setDownloading] = useState<string | null>(null);

	const load = async () => {
		setLoading(true);
		try {
			const data = await adminService.getAdminReceipts();
			setReceipts(data.receipts || []);
		} catch (e) {
			toast({ title: 'خطا در دریافت رسیدها', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		if (!s) return receipts;
		return receipts.filter((r) =>
			(r.ref_id || '').toLowerCase().includes(s) || (r.service || '').toLowerCase().includes(s) || (r.user_id || '').toLowerCase().includes(s)
		);
	}, [receipts, search]);

	const download = async (id: string, format: 'pdf' | 'html') => {
		setDownloading(id);
		try {
			const blob = await adminService.downloadReceipt(id, format);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `receipt-${id}.${format === 'pdf' ? 'pdf' : 'html'}`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			toast({ title: 'دانلود ناموفق', variant: 'destructive' });
		} finally {
			setDownloading(null);
		}
	};

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>مدیریت رسیدها</CardTitle>
				<Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1">
					<RefreshCw className="w-4 h-4" />
					بروزرسانی
				</Button>
			</CardHeader>
			<CardContent>
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
					<Input placeholder="جستجو (RefId/کاربر/سرویس)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
				</div>

				{loading ? (
					<div className="text-center text-sm text-muted-foreground py-8">در حال بارگیری...</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">رسیـدی یافت نشد</div>
				) : (
					<div className="space-y-3">
						{filtered.map((r) => (
							<div key={r.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm">{r.service || 'سرویس'}</div>
									<div className="text-xs text-muted-foreground mt-1">کاربر: {r.user_id}</div>
									<div className="text-xs text-muted-foreground mt-1">RefId: {r.ref_id || '—'}</div>
									<div className="text-xs text-muted-foreground mt-1">تاریخ: {formatDate(r.created_at)}</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="font-medium whitespace-nowrap">{formatAmount(r.amount)}</div>
									<Button variant="outline" size="sm" disabled={downloading === r.id} onClick={() => download(r.id, 'pdf')} className="flex items-center gap-1">
										<Download className="w-4 h-4" /> PDF
									</Button>
									<Button variant="outline" size="sm" disabled={downloading === r.id} onClick={() => download(r.id, 'html')} className="flex items-center gap-1">
										<FileText className="w-4 h-4" /> HTML
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default AdminReceiptManager;


