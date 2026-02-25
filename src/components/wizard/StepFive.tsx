import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Globe, Shield, Clock, Check, X, Loader2, DollarSign, Plus, Trash2, LogIn, UserPlus } from 'lucide-react';
import { wizardService, type DomainAvailabilityResponse } from "@/lib/services";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Extend Window interface to include our custom navigation function
declare global {
  interface Window {
    __APP_NAVIGATE__?: (path: string) => void;
  }
}

interface StepFiveProps {
  data: {
    userInfo?: {
      name?: string;
      email?: string;
      domain?: string;
      domainExtension?: string;
      domainPrice?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
    websiteFramework?: {
      dynamicDesign?: {
        pages: Array<{
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
  };
  updateData: (data: Partial<{
    userInfo: {
      name?: string;
      email?: string;
      domain?: string;
      domainExtension?: string;
      domainPrice?: string;
      additionalDomains?: Array<{
        domain: string;
        extension: string;
        price: number;
        available: boolean;
      }>;
    };
  }>) => void;
}

// Use the imported type
type DomainAvailability = DomainAvailabilityResponse;

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

// Reusable info card component
const InfoCard = ({ 
  icon: Icon, 
  title, 
  description, 
  bgColor, 
  iconColor,
  className = ""
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  className?: string;
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="min-w-0 flex-1">
      <h4 className={`font-medium ${iconColor} mb-1 text-sm sm:text-base`}>{title}</h4>
      <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{description}</p>
    </div>
  </div>
);

// Reusable domain input component
const DomainInput = ({
  value,
  onChange,
  placeholder,
  extension,
  isChecking,
  domainCheck,
  onCheck,
  validationError,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  extension: string;
  isChecking: boolean;
  domainCheck: DomainAvailability | null;
  onCheck: () => void;
  validationError?: string;
  className?: string;
}) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className={`input-modern ${
            value && validationError
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
      <span className="text-muted-foreground whitespace-nowrap text-sm sm:text-base">{extension}</span>
      {value && !validationError && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCheck}
          disabled={isChecking}
          className="whitespace-nowrap text-xs sm:text-sm"
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
    
    {validationError && (
      <p className="text-xs sm:text-sm text-destructive leading-tight">
        {validationError}
      </p>
    )}
  </div>
);

// Reusable domain status component
const DomainStatus = ({ domainCheck }: { domainCheck: DomainAvailability | null }) => {
  if (!domainCheck) return null;
  
  return (
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
        <span className="font-medium text-xs sm:text-sm">{domainCheck.message}</span>
      </div>
      
      {/* Show WHOIS data if available */}
      {!domainCheck.available && domainCheck.whoisData && (
        <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
          <div className="text-xs opacity-90">
            <strong>اطلاعات دامنه:</strong>
          </div>
          {domainCheck.whoisData.registrar && (
            <div className="text-xs opacity-75">
              ثبت‌کننده: {domainCheck.whoisData.registrar.name}
            </div>
          )}
          {domainCheck.whoisData.createDate && (
            <div className="text-xs opacity-75">
              تاریخ ثبت: {new Date(domainCheck.whoisData.createDate).toLocaleDateString('fa-IR')}
            </div>
          )}
          {domainCheck.whoisData.expireDate && (
            <div className="text-xs opacity-75">
              تاریخ انقضا: {new Date(domainCheck.whoisData.expireDate).toLocaleDateString('fa-IR')}
            </div>
          )}
          {domainCheck.whoisData.domainAge !== undefined && (
            <div className="text-xs opacity-75">
              سن دامنه: {Math.floor(domainCheck.whoisData.domainAge / 365)} سال
            </div>
          )}
        </div>
      )}
      
      {domainCheck.checkedAt && (
        <div className="text-xs mt-2 opacity-75">
          بررسی شده در: {new Date(domainCheck.checkedAt).toLocaleString('fa-IR')}
        </div>
      )}
    </div>
  );
};

const StepFive = ({ data, updateData }: StepFiveProps) => {
  const [domainCheck, setDomainCheck] = useState<DomainAvailability | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedExtension, setSelectedExtension] = useState('.ir');
  const [additionalDomain, setAdditionalDomain] = useState('');
  const [additionalExtension, setAdditionalExtension] = useState('.com');
  const { toast } = useToast();
  const { user } = useAuth();

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
      const result = await wizardService.checkDomainAvailability({ domain, extension });
      // Store the extension for later use
      setDomainCheck({ ...result, extension } as any);
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

  // Initialize primary domain extension to .ir
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

  // Save design to local storage for guest users
  const saveDesignToLocalStorage = () => {
    if (!user && data.websiteFramework?.dynamicDesign) {
      const designData = {
        design: data.websiteFramework.dynamicDesign,
        timestamp: new Date().toISOString(),
        userInfo: data.userInfo
      };
      localStorage.setItem('arzansite_design', JSON.stringify(designData));
      toast({
        title: "طراحی ذخیره شد",
        description: "طراحی شما در مرورگر ذخیره شده و می‌توانید بعداً ادامه دهید.",
      });
    }
  };

  // Add additional domain
  const addAdditionalDomain = async () => {
    if (!additionalDomain || !validateDomain(additionalDomain)) {
      toast({
        title: "خطا",
        description: "لطفاً نام دامنه معتبر وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    // Check domain availability
    setIsChecking(true);
    try {
      const result = await wizardService.checkDomainAvailability({ domain: additionalDomain, extension: additionalExtension });

      if (result?.available) {
        const extension = DOMAIN_EXTENSIONS.find(ext => ext.value === additionalExtension);
        const newDomain = {
          domain: additionalDomain,
          extension: additionalExtension,
          price: extension?.price || 0,
          available: true
        };

        const currentDomains = data.userInfo?.additionalDomains || [];
        updateData({
          userInfo: {
            ...data.userInfo,
            additionalDomains: [...currentDomains, newDomain]
          }
        });

        setAdditionalDomain('');
        toast({
          title: "دامنه اضافه شد",
          description: `${additionalDomain}${additionalExtension} به لیست دامنه‌های شما اضافه شد.`,
        });
      } else {
        toast({
          title: "دامنه در دسترس نیست",
          description: `${additionalDomain}${additionalExtension} قبلاً ثبت شده است.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در بررسی دامنه پیش آمد.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Remove additional domain
  const removeAdditionalDomain = (index: number) => {
    const currentDomains = data.userInfo?.additionalDomains || [];
    const updatedDomains = currentDomains.filter((_, i) => i !== index);
    updateData({
      userInfo: {
        ...data.userInfo,
        additionalDomains: updatedDomains
      }
    });
  };

  // Calculate total domain cost
  const calculateTotalDomainCost = () => {
    const primaryDomainCost = parseInt(data.userInfo?.domainPrice || '0');
    const additionalDomainsCost = (data.userInfo?.additionalDomains || []).reduce((total, domain) => total + domain.price, 0);
    return primaryDomainCost + additionalDomainsCost;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">انتخاب دامنه</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          دامنه وب‌سایت خود را انتخاب کنید
        </p>
      </div>

      <div className="grid grid-cols-1 max-w-2xl mx-auto gap-4 sm:gap-6">
        {/* User Authentication Status - Only show for non-logged in users */}
        {!user && (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="w-5 h-5 text-primary" />
                وضعیت کاربر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-warning text-sm sm:text-base">کاربر مهمان</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    طراحی شما در مرورگر ذخیره می‌شود
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    try {
                      const navigate = window.__APP_NAVIGATE__;
                      if (navigate) {
                        navigate('/auth?redirect=wizard');
                      } else {
                        window.location.href = '/auth?redirect=wizard';
                      }
                    } catch {
                      // Fallback to window.location if navigation fails
                      window.location.href = '/auth?redirect=wizard';
                    }
                  }}
                >
                  <LogIn className="w-4 h-4 ml-2" />
                  ورود
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    try {
                      const navigate = window.__APP_NAVIGATE__;
                      if (navigate) {
                        navigate('/auth?redirect=wizard&mode=signup');
                      } else {
                        window.location.href = '/auth?redirect=wizard&mode=signup';
                      }
                    } catch {
                      // Fallback to window.location if navigation fails
                      window.location.href = '/auth?redirect=wizard&mode=signup';
                    }
                  }}
                >
                  <UserPlus className="w-4 h-4 ml-2" />
                  ثبت‌نام
                </Button>
              </div>
              
              <Button 
                variant="secondary" 
                onClick={saveDesignToLocalStorage}
                className="w-full"
              >
                ذخیره طراحی در مرورگر
              </Button>
              
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                برای ذخیره دائمی طراحی و دسترسی از هر دستگاه، لطفاً ثبت‌نام کنید.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Domain Selection */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="w-5 h-5 text-primary" />
              انتخاب دامنه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Primary Domain (.ir) */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium">
                دامنه اصلی (.ir) *
              </Label>
              
              <DomainInput
                value={data.userInfo?.domain || ''}
                onChange={(value) => updateUserInfo('domain', value)}
                placeholder="mywebsite"
                extension=".ir"
                isChecking={isChecking}
                domainCheck={domainCheck}
                onCheck={() => checkDomainAvailability(data.userInfo?.domain, '.ir')}
                validationError={data.userInfo?.domain && !validateDomain(data.userInfo.domain) 
                  ? "نام دامنه باید شامل حروف انگلیسی، اعداد و خط تیره باشد و حداقل 2 کاراکتر داشته باشد" 
                  : undefined}
              />
              
              <DomainStatus domainCheck={domainCheck} />
              
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                  دامنه اصلی شما: <strong className="text-primary">
                    {data.userInfo?.domain || 'mywebsite'}.ir
                  </strong>
                </p>
                <div className="mt-1 text-success font-medium flex items-center gap-1 text-xs sm:text-sm">
                  <Check className="w-3 h-3" />
                  <span>رایگان برای یک سال</span>
                </div>
              </div>
            </div>

            {/* Additional Domains */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base font-medium">
                  دامنه‌های اضافی (اختیاری)
                </Label>
                <Badge variant="secondary" className="text-xs">
                  {data.userInfo?.additionalDomains?.length || 0} دامنه
                </Badge>
              </div>
              
              {/* Add Additional Domain */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder="نام دامنه"
                      value={additionalDomain}
                      onChange={(e) => setAdditionalDomain(e.target.value.toLowerCase())}
                      className={`input-modern ${
                        additionalDomain && !validateDomain(additionalDomain)
                          ? 'border-destructive focus:ring-destructive'
                          : ''
                      }`}
                    />
                  </div>
                  <Select 
                    value={additionalExtension} 
                    onValueChange={setAdditionalExtension}
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_EXTENSIONS.filter(ext => ext.value !== '.ir').map((ext) => (
                        <SelectItem key={ext.value} value={ext.value}>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs sm:text-sm">{ext.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {ext.price === 0 ? 'رایگان' : formatPrice(ext.price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalDomain}
                    disabled={isChecking || !additionalDomain || !validateDomain(additionalDomain)}
                    className="w-full sm:w-auto whitespace-nowrap text-xs sm:text-sm"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    اضافه کردن
                  </Button>
                </div>
              </div>

              {/* Additional Domains List */}
              {data.userInfo?.additionalDomains && data.userInfo.additionalDomains.length > 0 && (
                <div className="space-y-2">
                  {data.userInfo.additionalDomains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="font-medium text-sm sm:text-base truncate">
                          {domain.domain}{domain.extension}
                        </span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {domain.price === 0 ? 'رایگان' : formatPrice(domain.price)}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdditionalDomain(index)}
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-info mb-2 text-sm sm:text-base">💡 نکات مهم دامنه:</h4>
              <ul className="text-xs sm:text-sm space-y-1 text-info leading-tight">
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
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="w-5 h-5 text-success" />
              امنیت و حریم خصوصی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard
                icon={Shield}
                title="اطلاعات محفوظ"
                description="تمام اطلاعات شما با رمزنگاری محافظت می‌شود"
                bgColor="bg-success/10"
                iconColor="text-success"
              />
              <InfoCard
                icon={Clock}
                title="پردازش سریع"
                description="وب‌سایت شما ظرف 24-48 ساعت آماده می‌شود"
                bgColor="bg-primary/10"
                iconColor="text-primary"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Validation Summary */}
      {data.userInfo?.domain && (
        <div className="text-center p-4 bg-success/10 rounded-xl border border-success/20 max-w-2xl mx-auto">
          <p className="text-success font-medium mb-2 text-sm sm:text-base">
            ✓ دامنه اصلی انتخاب شده است
          </p>
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1 leading-tight">
            <div>
              دامنه اصلی: <span className="font-medium text-primary">{data.userInfo.domain}.ir</span>
              <span className="text-success"> (رایگان)</span>
            </div>
            {data.userInfo?.additionalDomains && data.userInfo.additionalDomains.length > 0 && (
              <div>
                دامنه‌های اضافی: <span className="font-medium text-primary">{data.userInfo.additionalDomains.length} دامنه</span>
              </div>
            )}
            {calculateTotalDomainCost() > 0 && (
              <div>
                هزینه کل دامنه‌ها: <span className="font-medium text-primary">{formatPrice(calculateTotalDomainCost())}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepFive;