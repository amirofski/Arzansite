import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  ArrowUpDown,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { enhancedApiClient } from '@/lib/enhancedApiClient';
import { WalletService } from '@/lib/walletService';

interface EnhancedWalletAnalyticsProps {
  className?: string;
  onRefresh?: () => void;
}

const EnhancedWalletAnalytics: React.FC<EnhancedWalletAnalyticsProps> = ({
  className = '',
  onRefresh
}) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [transactionsData, setTransactionsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  useEffect(() => {
    fetchWalletAnalytics();
  }, [selectedPeriod]);

  const fetchWalletAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, transactionsResponse] = await Promise.all([
        enhancedApiClient.getWalletTransactionAnalytics({ period: selectedPeriod }),
        enhancedApiClient.getEnhancedWalletTransactions({ 
          limit: 50, 
          page: 1,
          from_date: getDateFromPeriod(selectedPeriod)
        })
      ]);
      
      setAnalyticsData(analyticsResponse);
      setTransactionsData(transactionsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات کیف پول');
    } finally {
      setLoading(false);
    }
  };

  const getDateFromPeriod = (period: string): string => {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'refund':
        return <ArrowUpDown className="w-4 h-4 text-purple-600" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionTypeText = (type: string): string => {
    switch (type) {
      case 'deposit':
        return 'شارژ';
      case 'withdrawal':
        return 'برداشت';
      case 'payment':
        return 'پرداخت';
      case 'refund':
        return 'بازپرداخت';
      case 'credit':
        return 'اعتبار';
      case 'debit':
        return 'بدهی';
      default:
        return type;
    }
  };

  const getTransactionStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTransactionStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'موفق';
      case 'pending':
        return 'در انتظار';
      case 'failed':
        return 'ناموفق';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>تحلیل کیف پول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>تحلیل کیف پول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchWalletAnalytics} variant="outline">
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData || !transactionsData) {
    return (
      <Card className={className}>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            اطلاعات تحلیل کیف پول یافت نشد
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            تحلیل کیف پول
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="7d">۷ روز گذشته</option>
              <option value="30d">۳۰ روز گذشته</option>
              <option value="90d">۹۰ روز گذشته</option>
              <option value="1y">یک سال گذشته</option>
              <option value="all">همه</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWalletAnalytics}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              بروزرسانی
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
            <TabsTrigger value="trends">روندها</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">
                  {analyticsData.totalTransactions}
                </div>
                <div className="text-sm text-green-600">کل تراکنش‌ها</div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {WalletService.formatAmount(analyticsData.totalVolume)}
                </div>
                <div className="text-sm text-blue-600">حجم کل</div>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {WalletService.formatAmount(analyticsData.averageTransactionValue)}
                </div>
                <div className="text-sm text-purple-600">میانگین تراکنش</div>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {analyticsData.transactionTypeDistribution?.deposit || 0}
                </div>
                <div className="text-sm text-orange-600">شارژهای موفق</div>
              </div>
            </div>

            {/* Transaction Type Distribution */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                توزیع نوع تراکنش‌ها
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(analyticsData.transactionTypeDistribution || {}).map(([type, count]) => (
                  <div key={type} className="p-3 bg-muted/30 rounded-lg text-center">
                    <div className="text-lg font-semibold">{count as number}</div>
                    <div className="text-sm text-muted-foreground">
                      {getTransactionTypeText(type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trends */}
            {analyticsData.monthlyTrends && analyticsData.monthlyTrends.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  روند ماهانه
                </h4>
                <div className="space-y-2">
                  {analyticsData.monthlyTrends.slice(-6).map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{trend.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {trend.transactions} تراکنش
                        </span>
                        <span className="font-semibold">
                          {WalletService.formatAmount(trend.volume)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">تراکنش‌های اخیر</h4>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                دانلود گزارش
              </Button>
            </div>
            
            <div className="space-y-3">
              {transactionsData.transactions.slice(0, 10).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      {getTransactionTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {getTransactionTypeText(transaction.type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.type === 'deposit' || transaction.type === 'refund' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                      {WalletService.formatAmount(transaction.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={getTransactionStatusColor(transaction.status)}>
                    {getTransactionStatusText(transaction.status)}
                  </Badge>
                </div>
              ))}
            </div>
            
            {transactionsData.transactions.length > 10 && (
              <div className="text-center">
                <Button variant="outline" size="sm">
                  مشاهده همه تراکنش‌ها
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <h4 className="font-semibold">تحلیل روندها</h4>
            
            {/* Top Transaction Sources */}
            {analyticsData.topTransactionSources && analyticsData.topTransactionSources.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-sm text-muted-foreground">منابع اصلی تراکنش‌ها</h5>
                {analyticsData.topTransactionSources.map((source: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{source.source}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{source.count} تراکنش</div>
                      <div className="text-sm text-muted-foreground">
                        {WalletService.formatAmount(source.volume)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Spending Patterns */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">الگوی خرج کردن</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• میانگین تراکنش: {WalletService.formatAmount(analyticsData.averageTransactionValue)}</div>
                <div>• بیشترین تراکنش: {WalletService.formatAmount(Math.max(...analyticsData.monthlyTrends?.map((t: any) => t.volume) || [0]))}</div>
                <div>• کمترین تراکنش: {WalletService.formatAmount(Math.min(...analyticsData.monthlyTrends?.map((t: any) => t.volume) || [0]))}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedWalletAnalytics;











