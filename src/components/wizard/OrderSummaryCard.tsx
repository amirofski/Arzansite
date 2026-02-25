import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  User, 
  Globe, 
  Palette, 
  Layers, 
  Calculator,
  Wallet,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { calculateTotalPrice } from '@/lib/pricingUtils';
import { formatPriceWithUnit } from '@/lib/pricingUtils';
import { formatAmount } from '@/lib/currencyUtils';

interface OrderSummaryCardProps {
  wizardData: {
    siteType: 'personal' | 'business' | '';
    modules: Array<{
      id: string;
      name: string;
      nameEn: string;
      complexity: number;
      customizations: {
        layout: string;
        colors: string;
        animations: string;
      };
    }>;
    websiteFramework?: {
      dynamicDesign?: {
        pages?: Array<{
          id: string;
          name: string;
          sections: Array<{
            id: string;
            sectionType: string;
            layoutId: string;
            order: number;
            customData?: Record<string, unknown>;
          }>;
          canvasDimensions: {
            width: number;
            height: number;
          };
        }>;
        currentPageId: string;
      };
    };
    branding?: {
      primaryColor?: string;
      fontFamily?: string;
      logo?: string;
    };
    pricing?: {
      additionalServices?: Record<string, boolean>;
      customizationLevel?: number[];
      rushDelivery?: boolean;
      totalPrice?: number;
    };
    paymentCycle?: 'monthly' | 'annual';
    autoRenewal?: boolean;
    userInfo?: {
      domain?: string;
      name?: string;
      email?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
  };
  walletBalance?: number;
  onEditSection?: (section: string) => void;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ 
  wizardData, 
  walletBalance = 0,
  onEditSection 
}) => {
  const pricingBreakdown = calculateTotalPrice({
    siteType: wizardData.siteType,
    websiteFramework: wizardData.websiteFramework?.dynamicDesign
      ? { dynamicDesign: { pages: wizardData.websiteFramework.dynamicDesign.pages || [], currentPageId: wizardData.websiteFramework.dynamicDesign.currentPageId } }
      : undefined,
    branding: wizardData.branding,
    userInfo: wizardData.userInfo,
    additionalServices: wizardData.pricing?.additionalServices,
    paymentCycle: wizardData.paymentCycle || 'monthly'
  });

  const totalCost = (wizardData.paymentCycle === 'annual' ? pricingBreakdown.annualPrice : pricingBreakdown.monthlyPrice);
  const hasInsufficientFunds = walletBalance > 0 && walletBalance < totalCost;
  const canPayWithWallet = walletBalance >= totalCost;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Check className="w-5 h-5" />
          خلاصه سفارش
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Order Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">نوع وب‌سایت</h4>
              <p className="text-sm text-muted-foreground">
                {wizardData.siteType === 'personal' ? 'شخصی' : 'تجاری'}
              </p>
              {onEditSection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs mt-1"
                  onClick={() => onEditSection('siteType')}
                >
                  ویرایش
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h4 className="font-semibold">دامنه</h4>
              <p className="text-sm text-muted-foreground">
                {wizardData.userInfo?.domain || 'mywebsite'}.ir
              </p>
              {onEditSection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs mt-1"
                  onClick={() => onEditSection('domain')}
                >
                  ویرایش
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold">تعداد صفحات</h4>
              <p className="text-sm text-muted-foreground">
                {pricingBreakdown.pagesCount} صفحه
              </p>
              {onEditSection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs mt-1"
                  onClick={() => onEditSection('pages')}
                >
                  ویرایش
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">تعداد بخش‌ها</h4>
              <p className="text-sm text-muted-foreground">
                {pricingBreakdown.totalSections} بخش
              </p>
              {onEditSection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs mt-1"
                  onClick={() => onEditSection('sections')}
                >
                  ویرایش
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Services */}
        {wizardData.pricing?.additionalServices && Object.values(wizardData.pricing.additionalServices).some(Boolean) && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              خدمات اضافی انتخاب شده
            </h4>
            <div className="flex flex-wrap gap-2">
              {wizardData.pricing?.additionalServices?.seoOptimization && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  SEO
                </Badge>
              )}
              {wizardData.pricing?.additionalServices?.socialMediaIntegration && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  شبکه‌های اجتماعی
                </Badge>
              )}
              {wizardData.pricing?.additionalServices?.analyticsSetup && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  آنالیتیکس
                </Badge>
              )}
              {wizardData.pricing?.additionalServices?.backupService && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  پشتیبان‌گیری
                </Badge>
              )}
              {wizardData.pricing?.additionalServices?.maintenancePlan && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  نگهداری
                </Badge>
              )}
              {wizardData.pricing?.additionalServices?.rushDelivery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  تحویل فوری
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Payment Cycle Info */}
        {wizardData.paymentCycle && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="font-medium">دوره پرداخت</span>
              </div>
              <Badge variant="outline">
                {wizardData.paymentCycle === 'annual' ? 'سالانه' : 'ماهانه'}
              </Badge>
            </div>
            {wizardData.paymentCycle === 'annual' && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">تخفیف سالانه: {formatPriceWithUnit(pricingBreakdown.annualDiscount)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wallet Balance Info */}
        {walletBalance > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">موجودی کیف پول</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-700">
{formatAmount(walletBalance, 'RIAL')}
                </div>
                <div className="text-xs text-blue-600">
                  موجودی فعلی
                </div>
              </div>
            </div>
            
            {hasInsufficientFunds && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">موجودی ناکافی</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  برای پرداخت این سفارش نیاز به شارژ کیف پول دارید.
                </p>
                <div className="mt-2 text-xs text-yellow-600">
                  <span>نیاز: {formatPriceWithUnit(totalCost)}</span>
                  <span className="mx-2">•</span>
                  <span>کمبود: {formatPriceWithUnit(totalCost - walletBalance)}</span>
                </div>
              </div>
            )}

            {canPayWithWallet && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">قابل پرداخت از کیف پول</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  موجودی شما برای پرداخت این سفارش کافی است.
                </p>
                <div className="mt-2 text-xs text-green-600">
                  <span>موجودی پس از پرداخت: {formatPriceWithUnit(walletBalance - totalCost)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Breakdown */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">جزئیات قیمت</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>قیمت پایه:</span>
              <span>{formatPriceWithUnit(pricingBreakdown.basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>هزینه صفحات:</span>
              <span>{formatPriceWithUnit(pricingBreakdown.pagesCost)}</span>
            </div>
            <div className="flex justify-between">
              <span>هزینه بخش‌ها:</span>
              <span>{formatPriceWithUnit(pricingBreakdown.sectionsCost)}</span>
            </div>
            {pricingBreakdown.additionalServicesCost > 0 && (
              <div className="flex justify-between">
                <span>خدمات اضافی:</span>
                <span>{formatPriceWithUnit(pricingBreakdown.additionalServicesCost)}</span>
              </div>
            )}
            {wizardData.paymentCycle === 'annual' && pricingBreakdown.annualDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>تخفیف سالانه:</span>
                <span>-{formatPriceWithUnit(pricingBreakdown.annualDiscount)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>قیمت نهایی:</span>
              <span className="text-primary">{formatPriceWithUnit(totalCost)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummaryCard;











