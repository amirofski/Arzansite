import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Globe, Shield, Clock } from 'lucide-react';

interface StepFiveProps {
  data: any;
  updateData: (data: any) => void;
}

const StepFive = ({ data, updateData }: StepFiveProps) => {
  const updateUserInfo = (field: string, value: string) => {
    updateData({
      userInfo: {
        ...data.userInfo,
        [field]: value
      }
    });
  };

  const validateDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/;
    return domainRegex.test(domain);
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
              <div className="flex items-center gap-2">
                <Input
                  id="domain"
                  type="text"
                  placeholder="mywebsite"
                  value={data.userInfo?.domain || ''}
                  onChange={(e) => updateUserInfo('domain', e.target.value.toLowerCase())}
                  className={`input-modern flex-1 ${
                    data.userInfo?.domain && !validateDomain(data.userInfo.domain)
                      ? 'border-destructive focus:ring-destructive'
                      : ''
                  }`}
                />
                <span className="text-muted-foreground whitespace-nowrap">.ir</span>
              </div>
              {data.userInfo?.domain && !validateDomain(data.userInfo.domain) && (
                <p className="text-sm text-destructive">
                  نام دامنه باید شامل حروف انگلیسی، اعداد و خط تیره باشد
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                نام دامنه شما: <strong>{data.userInfo?.domain || 'mywebsite'}.ir</strong>
              </p>
            </div>

            <div className="bg-info/10 border border-info/20 rounded-lg p-4">
              <h4 className="font-medium text-info mb-2">💡 نکات مهم دامنه:</h4>
              <ul className="text-sm space-y-1 text-info">
                <li>• دامنه .ir برای یک سال رایگان ارائه می‌شود</li>
                <li>• امکان تغییر دامنه تا 24 ساعت بعد از سفارش</li>
                <li>• دامنه باید منحصر به فرد باشد</li>
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
      {data.userInfo?.name && data.userInfo?.email && data.userInfo?.domain && (
        <div className="text-center p-4 bg-success/10 rounded-xl border border-success/20 max-w-2xl mx-auto">
          <p className="text-success font-medium">
            ✓ تمام اطلاعات مورد نیاز وارد شده است
          </p>
        </div>
      )}
    </div>
  );
};

export default StepFive;