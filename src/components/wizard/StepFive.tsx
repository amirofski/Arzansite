import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Globe, Shield, Clock, Check, X, Loader2, DollarSign } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StepFiveProps {
  data: any;
  updateData: (data: any) => void;
}

interface DomainAvailability {
  available: boolean;
  domain: string;
  extension: string;
  price: number;
  description: string;
  message: string;
  error?: string;
  checkedAt?: string;
}

const DOMAIN_EXTENSIONS = [
  { value: '.ir', label: '.ir', price: 0, description: 'دامنه ایرانی - یک سال رایگان' },
  { value: '.com', label: '.com', price: 450000, description: 'محبوب‌ترین پسوند جهانی' },
  { value: '.net', label: '.net', price: 520000, description: 'مناسب برای شبکه‌ها و فناوری' },
  { value: '.org', label: '.org', price: 480000, description: 'مناسب برای سازمان‌ها' },
  { value: '.info', label: '.info', price: 380000, description: 'مناسب برای وب‌سایت‌های اطلاعاتی' },
  { value: '.biz', label: '.biz', price: 420000, description: 'مناسب برای کسب‌وکار' },
  { value: '.co', label: '.co', price: 950000, description: 'کوتاه و قدرتمند' },
  { value: '.io', label: '.io', price: 1850000, description: 'محبوب در میان استارتاپ‌ها' },
  { value: '.me', label: '.me', price: 750000, description: 'مناسب برای وب‌سایت‌های شخصی' },
  { value: '.cc', label: '.cc', price: 580000, description: 'کوتاه و منحصربه‌فرد' },
];

const StepFive = ({ data, updateData }: StepFiveProps) => {
  const [domainCheck, setDomainCheck] = useState<DomainAvailability | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedExtension, setSelectedExtension] = useState('.ir');
  const { toast } = useToast();

  const updateUserInfo = (field: string, value: string) => {
    const newUserInfo = {
      ...data.userInfo,
      [field]: value
    };

    // Update domain pricing when extension changes
    if (field === 'domainExtension') {
      setSelectedExtension(value);
      const extension = DOMAIN_EXTENSIONS.find(ext => ext.value === value);
      if (extension) {
        newUserInfo.domainPrice = extension.price.toString();
      }
      // Reset domain check when extension changes
      setDomainCheck(null);
    }

    updateData({
      userInfo: newUserInfo
    });
    
    // Reset domain check when domain changes
    if (field === 'domain') {
      setDomainCheck(null);
      
      // Clear existing timeout
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
      
      // Set new timeout for domain checking
      if (value && validateDomain(value)) {
        const timeout = setTimeout(() => {
          checkDomainAvailability(value, data.userInfo?.domainExtension || selectedExtension);
        }, 1000);
        setCheckTimeout(timeout);
      }
    }
  };

  const validateDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/;
    return domainRegex.test(domain) && domain.length >= 2;
  };

  const checkDomainAvailability = async (domain: string, extension: string = '.ir') => {
    if (!domain || !validateDomain(domain)) return;

    setIsChecking(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('check-domain-availability', {
        body: { domain, extension }
      });

      if (error) {
        console.error('Domain check error:', error);
        toast({
          title: "خطا در بررسی دامنه",
          description: "نتوانستیم وضعیت دامنه را بررسی کنیم. لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
        return;
      }

      setDomainCheck(result);
    } catch (error) {
      console.error('Domain check failed:', error);
      toast({
        title: "خطا در بررسی دامنه",
        description: "مشکلی در ارتباط با سرور پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Initialize extension and price on component mount
  useEffect(() => {
    if (!data.userInfo?.domainExtension) {
      updateUserInfo('domainExtension', '.ir');
      updateUserInfo('domainPrice', '0');
    } else {
      setSelectedExtension(data.userInfo.domainExtension);
    }
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [checkTimeout]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price) || 0 : price;
    return new Intl.NumberFormat('fa-IR').format(numPrice) + ' تومان';
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">اطلاعات شخصی</h2>
        <p className="text-muted-foreground">
          اطلاعات خود را برای تکمیل سفارش وارد کنید
        </p>
      </div>

      <div className="grid md:grid-cols-1 max-w-2xl mx-auto gap-6">
        {/* Personal Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              اطلاعات شخصی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                نام و نام خانوادگی *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="نام کامل خود را وارد کنید"
                value={data.userInfo?.name || ''}
                onChange={(e) => updateUserInfo('name', e.target.value)}
                className="input-modern"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                ایمیل *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={data.userInfo?.email || ''}
                onChange={(e) => updateUserInfo('email', e.target.value)}
                className={`input-modern ${
                  data.userInfo?.email && !isValidEmail(data.userInfo.email)
                    ? 'border-destructive focus:ring-destructive'
                    : ''
                }`}
              />
              {data.userInfo?.email && !isValidEmail(data.userInfo.email) && (
                <p className="text-sm text-destructive">
                  لطفاً یک ایمیل معتبر وارد کنید
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Domain Selection */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              انتخاب دامنه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-sm font-medium">
                نام دامنه مورد نظر *
              </Label>
              
              {/* Domain Extension Selector */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">انتخاب پسوند دامنه</Label>
                  <Select 
                    value={data.userInfo?.domainExtension || selectedExtension} 
                    onValueChange={(value) => updateUserInfo('domainExtension', value)}
                  >
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="انتخاب پسوند" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_EXTENSIONS.map((ext) => (
                        <SelectItem key={ext.value} value={ext.value}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{ext.label}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{ext.price === 0 ? 'رایگان' : formatPrice(ext.price)}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {DOMAIN_EXTENSIONS.find(ext => ext.value === (data.userInfo?.domainExtension || selectedExtension))?.description}
                  </p>
                </div>

                {/* Domain Name Input */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="domain"
                      type="text"
                      placeholder="mywebsite"
                      value={data.userInfo?.domain || ''}
                      onChange={(e) => updateUserInfo('domain', e.target.value.toLowerCase())}
                      className={`input-modern ${
                        data.userInfo?.domain && !validateDomain(data.userInfo.domain)
                          ? 'border-destructive focus:ring-destructive'
                          : domainCheck?.available === false
                          ? 'border-destructive focus:ring-destructive'
                          : domainCheck?.available === true
                          ? 'border-success focus:ring-success'
                          : ''
                      }`}
                    />
                    {isChecking && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!isChecking && domainCheck && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        {domainCheck.available ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <X className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {data.userInfo?.domainExtension || selectedExtension}
                  </span>
                  {data.userInfo?.domain && validateDomain(data.userInfo.domain) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => checkDomainAvailability(data.userInfo.domain, data.userInfo?.domainExtension || selectedExtension)}
                      disabled={isChecking}
                      className="whitespace-nowrap"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-1" />
                          بررسی...
                        </>
                      ) : (
                        'بررسی دامنه'
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {data.userInfo?.domain && !validateDomain(data.userInfo.domain) && (
                <p className="text-sm text-destructive">
                  نام دامنه باید شامل حروف انگلیسی، اعداد و خط تیره باشد و حداقل 2 کاراکتر داشته باشد
                </p>
              )}
              {domainCheck && (
                <div className={`text-sm p-3 rounded-lg ${
                  domainCheck.available 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {domainCheck.available ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span className="font-medium">{domainCheck.message}</span>
                  </div>
                  {domainCheck.available && domainCheck.price > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>هزینه دامنه: {formatPrice(domainCheck.price)}</span>
                    </div>
                  )}
                  {domainCheck.available && domainCheck.price === 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4" />
                      <span>دامنه .ir برای یک سال رایگان است</span>
                    </div>
                  )}
                  {domainCheck.checkedAt && (
                    <div className="text-xs mt-1 opacity-75">
                      بررسی شده در: {new Date(domainCheck.checkedAt).toLocaleString('fa-IR')}
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                نام دامنه شما: <strong>
                  {data.userInfo?.domain || 'mywebsite'}{data.userInfo?.domainExtension || selectedExtension}
                </strong>
                {data.userInfo?.domainPrice && parseInt(data.userInfo.domainPrice) > 0 && (
                  <span className="block mt-1 text-primary font-medium">
                    هزینه دامنه: {formatPrice(data.userInfo.domainPrice)}
                  </span>
                )}
              </p>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-4">
              <h4 className="font-medium text-info mb-2">💡 نکات مهم دامنه:</h4>
              <ul className="text-sm space-y-1 text-info">
                <li>• دامنه .ir برای یک سال رایگان ارائه می‌شود</li>
                <li>• دامنه‌های بین‌المللی (.com, .net, etc) با هزینه اضافه</li>
                <li>• امکان تغییر دامنه تا 24 ساعت بعد از سفارش</li>
                <li>• دامنه باید منحصر به فرد باشد</li>
                <li>• قیمت‌ها شامل تمدید یک ساله می‌باشد</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="bg-gradient-to-r from-success/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              امنیت و حریم خصوصی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-success" />
                </div>
                <div>
                  <h4 className="font-medium text-success mb-1">اطلاعات محفوظ</h4>
                  <p className="text-sm text-muted-foreground">
                    تمام اطلاعات شما با رمزنگاری محافظت می‌شود
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-1">پردازش سریع</h4>
                  <p className="text-sm text-muted-foreground">
                    وب‌سایت شما ظرف 24-48 ساعت آماده می‌شود
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Validation Summary */}
      {data.userInfo?.name && data.userInfo?.email && data.userInfo?.domain && data.userInfo?.domainExtension && (
        <div className="text-center p-4 bg-success/10 rounded-xl border border-success/20 max-w-2xl mx-auto">
          <p className="text-success font-medium mb-2">
            ✓ تمام اطلاعات مورد نیاز وارد شده است
          </p>
          {data.userInfo?.domainPrice && parseInt(data.userInfo.domainPrice) > 0 && (
            <div className="text-sm text-muted-foreground">
              هزینه دامنه: <span className="font-medium text-primary">{formatPrice(data.userInfo.domainPrice)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepFive;