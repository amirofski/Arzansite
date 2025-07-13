import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building2 } from 'lucide-react';

interface StepOneProps {
  data: any;
  updateData: (data: any) => void;
}

const StepOne = ({ data, updateData }: StepOneProps) => {
  const selectSiteType = (type: 'personal' | 'business') => {
    updateData({ siteType: type });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">نوع وب‌سایت خود را انتخاب کنید</h2>
        <p className="text-muted-foreground">
          براساس نوع وب‌سایت، بهترین قالب و امکانات را برای شما پیشنهاد می‌دهیم
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            data.siteType === 'personal'
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => selectSiteType('personal')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">وب‌سایت شخصی</h3>
            <p className="text-muted-foreground mb-6">
              مناسب برای نمایش کارهای شخصی، رزومه، وبلاگ و معرفی خودتان
            </p>
            <div className="text-sm text-primary font-medium">
              شامل: صفحه درباره من، نمونه کارها، تماس با من
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
            data.siteType === 'business'
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:ring-1 hover:ring-primary/50'
          }`}
          onClick={() => selectSiteType('business')}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-secondary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">وب‌سایت تجاری</h3>
            <p className="text-muted-foreground mb-6">
              مناسب برای کسب‌وکارها، شرکت‌ها و ارائه خدمات تجاری
            </p>
            <div className="text-sm text-secondary font-medium">
              شامل: معرفی شرکت، خدمات، تیم، تماس با ما
            </div>
          </CardContent>
        </Card>
      </div>

      {data.siteType && (
        <div className="text-center mt-8 p-4 bg-success/10 rounded-xl border border-success/20">
          <p className="text-success font-medium">
            ✓ نوع وب‌سایت انتخاب شد: {data.siteType === 'personal' ? 'شخصی' : 'تجاری'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StepOne;