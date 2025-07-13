import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Palette, Type } from 'lucide-react';

interface StepThreeProps {
  data: any;
  updateData: (data: any) => void;
}

const StepThree = ({ data, updateData }: StepThreeProps) => {
  const [logoPreview, setLogoPreview] = useState<string>(data.branding?.logo || '');

  const colors = [
    { name: 'بنفش', value: '#8B5CF6', gradient: 'from-purple-500 to-purple-600' },
    { name: 'آبی', value: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
    { name: 'سبز', value: '#10B981', gradient: 'from-green-500 to-green-600' },
    { name: 'قرمز', value: '#EF4444', gradient: 'from-red-500 to-red-600' },
    { name: 'نارنجی', value: '#F59E0B', gradient: 'from-orange-500 to-orange-600' },
    { name: 'صورتی', value: '#EC4899', gradient: 'from-pink-500 to-pink-600' },
  ];

  const fonts = [
    { name: 'وزیر', value: 'vazir', preview: 'نمونه متن با فونت وزیر' },
    { name: 'یکان', value: 'yekan', preview: 'نمونه متن با فونت یکان' },
    { name: 'نازنین', value: 'nazanin', preview: 'نمونه متن با فونت نازنین' },
    { name: 'تیترا', value: 'titra', preview: 'نمونه متن با فونت تیترا' },
  ];

  const updateBranding = (field: string, value: string) => {
    updateData({
      branding: {
        ...data.branding,
        [field]: value
      }
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setLogoPreview(base64);
        updateBranding('logo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">طراحی و برندینگ</h2>
        <p className="text-muted-foreground">
          رنگ اصلی، فونت و لوگوی وب‌سایت خود را انتخاب کنید
        </p>
      </div>

      {/* Color Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">انتخاب رنگ اصلی</Label>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {colors.map((color) => (
            <Card
              key={color.value}
              className={`cursor-pointer transition-all duration-300 ${
                data.branding?.primaryColor === color.value
                  ? 'ring-2 ring-offset-2 ring-primary'
                  : 'hover:shadow-medium'
              }`}
              onClick={() => updateBranding('primaryColor', color.value)}
            >
              <CardContent className="p-4 text-center">
                <div 
                  className={`w-12 h-12 rounded-full mx-auto mb-2 bg-gradient-to-r ${color.gradient}`}
                />
                <p className="text-sm font-medium">{color.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Font Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">انتخاب فونت</Label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {fonts.map((font) => (
            <Card
              key={font.value}
              className={`cursor-pointer transition-all duration-300 ${
                data.branding?.fontFamily === font.value
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:ring-1 hover:ring-primary/50 hover:shadow-medium'
              }`}
              onClick={() => updateBranding('fontFamily', font.value)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{font.name}</h3>
                <p className="text-muted-foreground text-lg" style={{ fontFamily: font.value }}>
                  {font.preview}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">آپلود لوگو (اختیاری)</Label>
        </div>
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="p-8">
            <div className="text-center">
              {logoPreview ? (
                <div className="space-y-4">
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="max-w-32 max-h-32 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-success">✓ لوگو آپلود شد</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLogoPreview('');
                      updateBranding('logo', '');
                    }}
                  >
                    حذف لوگو
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-2">آپلود لوگو</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      فرمت‌های مجاز: JPG، PNG، SVG (حداکثر 2MB)
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>انتخاب فایل</span>
                      </Button>
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">پیش‌نمایش طراحی</h3>
          <div 
            className="p-6 rounded-xl shadow-medium bg-white"
            style={{ 
              borderColor: data.branding?.primaryColor,
              borderWidth: '2px',
              fontFamily: data.branding?.fontFamily 
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded" />
              )}
              <div>
                <h4 className="text-xl font-bold" style={{ color: data.branding?.primaryColor }}>
                  نام وب‌سایت شما
                </h4>
                <p className="text-muted-foreground">توضیحات کوتاه درباره وب‌سایت</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                style={{ backgroundColor: data.branding?.primaryColor }}
                className="text-white"
              >
                دکمه اصلی
              </Button>
              <Button variant="outline" size="sm">
                دکمه ثانویه
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepThree;