import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { receiptService, useApi, Receipt } from '@/lib/services';
import { tokenManager } from '@/lib/tokenManager';
import { Download, RefreshCw, Search, FileText } from 'lucide-react';

interface ReceiptListProps {
	pageSize?: number;
}

const formatAmount = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : '—');

const ReceiptList: React.FC<ReceiptListProps> = ({ pageSize = 10 }) => {
	const { toast } = useToast();
	const [receipts, setReceipts] = useState<Receipt[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [downloading, setDownloading] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const { execute: fetchReceipts, loading: fetchLoading } = useApi(
		receiptService.getReceipts.bind(receiptService),
		{
			onSuccess: (data) => {
				// Handle direct array or wrapped response
				if (Array.isArray(data)) {
					setReceipts(data);
				} else if (data && typeof data === 'object') {
					if ('items' in data) setReceipts((data as any).items || []);
					else if ('receipts' in data) setReceipts((data as any).receipts || []);
					else if ('data' in data && Array.isArray((data as any).data)) setReceipts((data as any).data);
					else {
						console.warn('Unexpected receipt data structure:', data);
						setReceipts([]);
					}
				} else {
					setReceipts([]);
				}
			},
			onError: (error) => {
				console.error('Error loading receipts:', error);
				// Check if it's a missing collection error
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				if (errorMessage.includes('Collection with the requested ID could not be found') || 
					errorMessage.includes('AppwriteException')) {
					toast({ 
						title: 'سیستم در حال راه‌اندازی', 
						description: 'لطفاً چند لحظه صبر کنید تا سیستم رسیدها آماده شود',
						variant: 'default'
					});
				} else {
					setLoadError('خطا در دریافت رسیدها');
					toast({ title: 'خطا در دریافت رسیدها', variant: 'destructive' });
				}
			}
		}
	);

	const { execute: downloadReceipt, loading: downloadLoading } = useApi(
		receiptService.downloadReceipt.bind(receiptService),
		{
			onSuccess: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `receipt-${downloading}.pdf`;
				a.click();
				window.URL.revokeObjectURL(url);
				setDownloading(null);
			},
			onError: (error) => {
				toast({ title: 'دانلود ناموفق', variant: 'destructive' });
				setDownloading(null);
			}
		}
	);

	const load = async () => {
		// Ensure token exists to avoid immediate 401s after login
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
			await fetchReceipts();
		} catch (e: unknown) {
			console.error('Error loading receipts:', e);
			setLoadError('خطا در دریافت رسیدها');
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
		// Safety check to ensure receipts is an array
		if (!Array.isArray(receipts)) {
			console.warn('Receipts is not an array:', receipts);
			return [];
		}
		
		const s = search.trim().toLowerCase();
		if (!s) return receipts;
		return receipts.filter((r) =>
			(r.refId || '').toLowerCase().includes(s) || (r.service || '').toLowerCase().includes(s)
		);
	}, [receipts, search]);

	const download = async (id: string, format: 'pdf' | 'html') => {
		setDownloading(id);
		await downloadReceipt(id, format);
	};

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>رسیدها</CardTitle>
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
				<div className="relative mb-4">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
					<Input placeholder="جستجوی رسید (RefId/سرویس)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
				</div>

				{loading || fetchLoading ? (
					<div className="text-center text-sm text-muted-foreground py-8">در حال بارگیری...</div>
				) : filtered.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">رسیـدی یافت نشد</div>
				) : (
					<div className="space-y-3">
						{filtered.slice(0, pageSize).map((r) => (
							<div key={r.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm">{r.service || 'سرویس'}</div>
									<div className="text-xs text-muted-foreground mt-1">RefId: {r.refId || '—'}</div>
									<div className="text-xs text-muted-foreground mt-1">تاریخ: {formatDate(r.createdAt)}</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="font-medium whitespace-nowrap">{formatAmount(r.amount)}</div>
									<Button variant="outline" size="sm" disabled={downloading === r.id || downloadLoading} onClick={() => download(r.id, 'pdf')} className="flex items-center gap-1">
										<Download className="w-4 h-4" /> PDF
									</Button>
									<Button variant="outline" size="sm" disabled={downloading === r.id || downloadLoading} onClick={() => download(r.id, 'html')} className="flex items-center gap-1">
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

export default ReceiptList;


