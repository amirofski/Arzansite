import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/services';
import { Download, RefreshCw, Search, FileText, Eye, AlertCircle } from 'lucide-react';
import { AnimatedLoader } from '@/components/ui/AnimatedLoader';

interface AdminReceipt {
  id: string;
  user_id?: string;
  invoice_id?: string;
  payment_id?: string;
  ref_id?: string;
  amount: number;
  service?: string;
  format?: string;
  created_at: string;
  userProfile?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  invoice?: {
    id: string;
    order_id?: string;
    description?: string;
  };
  payment?: {
    id: string;
    order_id?: string;
    authority?: string;
  };
}

const formatAmount = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fa-IR') : '—');

const AdminReceiptManager: React.FC = () => {
	const { toast } = useToast();
	const [receipts, setReceipts] = useState<AdminReceipt[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [downloading, setDownloading] = useState<string | null>(null);
	const [from, setFrom] = useState<string>('');
	const [to, setTo] = useState<string>('');
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(20);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [selectedReceipt, setSelectedReceipt] = useState<AdminReceipt | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	const toIsoOrEmpty = (value: string) => {
		if (!value) return '';
		try { return new Date(value).toISOString(); } catch { return ''; }
	};

	const load = async () => {
		setLoading(true);
		try {
			const data = await adminService.getAdminReceipts({ page, limit, from: toIsoOrEmpty(from), to: toIsoOrEmpty(to) });
			setReceipts(Array.isArray(data.items) ? data.items : []);
			setTotalPages(data.pagination?.pages || 1);
		} catch (e) {
			toast({ 
				title: 'خطا در دریافت رسیدها', 
				description: 'مشکلی در دریافت اطلاعات رسیدها پیش آمد',
				variant: 'destructive' 
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReceiptDetails = (receipt: AdminReceipt) => {
		setSelectedReceipt(receipt);
		setShowDetails(true);
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit]);

	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		if (!s) return receipts;
		return receipts.filter((r) =>
			(r.ref_id || '').toLowerCase().includes(s) || 
			(r.service || '').toLowerCase().includes(s) || 
			(r.user_id || '').toLowerCase().includes(s) ||
			(r.userProfile?.email || '').toLowerCase().includes(s) ||
			(r.userProfile?.full_name || '').toLowerCase().includes(s) ||
			(r.invoice?.description || '').toLowerCase().includes(s)
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
			toast({
				title: 'دانلود موفق',
				description: `رسید ${format.toUpperCase()} با موفقیت دانلود شد`,
			});
		} catch (e) {
			toast({ 
				title: 'دانلود ناموفق', 
				description: 'مشکلی در دانلود رسید پیش آمد',
				variant: 'destructive' 
			});
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
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
						<Input placeholder="جستجو (RefId/کاربر/سرویس)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
							<p>رسیـدی یافت نشد</p>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						{filtered.map((r) => (
							<div key={r.id} className="p-3 border rounded-lg bg-background flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm">
										{r.service || r.invoice?.description || 'رسید پرداخت'}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										کاربر: {r.userProfile?.full_name || r.userProfile?.email || r.user_id}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										RefId: {r.ref_id || '—'}
										{r.payment?.authority && ` | Authority: ${r.payment.authority}`}
									</div>
									<div className="text-xs text-muted-foreground mt-1">
										تاریخ: {formatDate(r.created_at)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<div className="font-medium whitespace-nowrap">{formatAmount(r.amount)}</div>
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => handleReceiptDetails(r)}
									>
										<Eye className="h-4 w-4" />
									</Button>
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
				<div className="flex items-center justify-between mt-4">
					<div className="text-xs text-muted-foreground">صفحه {page} از {totalPages}</div>
					<div className="flex gap-2">
						<Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>قبلی</Button>
						<Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</Button>
					</div>
				</div>
				</CardContent>

				{/* Receipt Details Dialog */}
				<Dialog open={showDetails} onOpenChange={setShowDetails}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>جزئیات رسید</DialogTitle>
					</DialogHeader>
					{selectedReceipt && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">شناسه رسید</label>
									<p className="font-mono">{selectedReceipt.id}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">مبلغ</label>
									<p className="font-medium">{formatAmount(selectedReceipt.amount)}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">کد پیگیری</label>
									<p className="font-mono">{selectedReceipt.ref_id || '—'}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">فرمت</label>
									<p>{selectedReceipt.format || '—'}</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">تاریخ ایجاد</label>
									<p>{formatDate(selectedReceipt.created_at)}</p>
								</div>
							</div>
							
							{selectedReceipt.service && (
								<div>
									<label className="text-sm font-medium text-muted-foreground">سرویس</label>
									<p className="mt-1">{selectedReceipt.service}</p>
								</div>
							)}
							
							{selectedReceipt.userProfile && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات کاربر</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">نام</label>
											<p>{selectedReceipt.userProfile.full_name || '—'}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">ایمیل</label>
											<p>{selectedReceipt.userProfile.email}</p>
										</div>
									</div>
								</div>
							)}
							
							{selectedReceipt.invoice && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات فاکتور</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">شناسه فاکتور</label>
											<p>{selectedReceipt.invoice.id}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">توضیحات</label>
											<p>{selectedReceipt.invoice.description || '—'}</p>
										</div>
									</div>
								</div>
							)}
							
							{selectedReceipt.payment && (
								<div className="border-t pt-4">
									<h4 className="font-medium mb-2">اطلاعات پرداخت</h4>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="text-sm font-medium text-muted-foreground">شناسه پرداخت</label>
											<p>{selectedReceipt.payment.id}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-muted-foreground">Authority</label>
											<p className="font-mono text-sm">{selectedReceipt.payment.authority || '—'}</p>
										</div>
									</div>
								</div>
							)}
							
							<div className="border-t pt-4">
								<div className="flex gap-2">
									<Button 
										variant="outline" 
										disabled={downloading === selectedReceipt.id} 
										onClick={() => download(selectedReceipt.id, 'pdf')}
										className="flex items-center gap-1"
									>
										<Download className="w-4 h-4" /> دانلود PDF
									</Button>
									<Button 
										variant="outline" 
										disabled={downloading === selectedReceipt.id} 
										onClick={() => download(selectedReceipt.id, 'html')}
										className="flex items-center gap-1"
									>
										<FileText className="w-4 h-4" /> دانلود HTML
									</Button>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
			</Card>
		);
};

export default AdminReceiptManager;


