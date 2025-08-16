import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, Type, Files, Plus, X } from 'lucide-react';
import FileUploadManager from './FileUploadManager';

interface StepThreeProps {
  data: any;
  updateData: (data: any) => void;
}

const StepThree = ({ data, updateData }: StepThreeProps) => {
  const [customColors, setCustomColors] = useState<string[]>(data.branding?.customColors || []);
  const [newColor, setNewColor] = useState('#000000');

  const predefinedColors = [
    { name: 'بنفش', value: '#8B5CF6', gradient: 'from-purple-500 to-purple-600' },
    { name: 'آبی', value: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
    { name: 'سبز', value: '#10B981', gradient: 'from-green-500 to-green-600' },
    { name: 'قرمز', value: '#EF4444', gradient: 'from-red-500 to-red-600' },
    { name: 'نارنجی', value: '#F59E0B', gradient: 'from-orange-500 to-orange-600' },
    { name: 'صورتی', value: '#EC4899', gradient: 'from-pink-500 to-pink-600' },
    { name: 'زرد', value: '#EAB308', gradient: 'from-yellow-500 to-yellow-600' },
    { name: 'سرمه‌ای', value: '#1E40AF', gradient: 'from-blue-700 to-blue-800' },
    { name: 'سبز تیره', value: '#059669', gradient: 'from-green-600 to-green-700' },
    { name: 'قرمز تیره', value: '#DC2626', gradient: 'from-red-600 to-red-700' },
  ];

  const fonts = [
    { name: 'وزیر', value: 'vazir', preview: 'نمونه متن با فونت وزیر' },
    { name: 'یکان', value: 'yekan', preview: 'نمونه متن با فونت یکان' },
    { name: 'نازنین', value: 'nazanin', preview: 'نمونه متن با فونت نازنین' },
    { name: 'تیترا', value: 'titra', preview: 'نمونه متن با فونت تیترا' },
    { name: 'ایران سنس', value: 'iransans', preview: 'نمونه متن با فونت ایران سنس' },
    { name: 'کامپوزیت', value: 'composite', preview: 'نمونه متن با فونت کامپوزیت' },
  ];

  const updateBranding = (field: string, value: any) => {
    updateData({
      branding: {
        ...data.branding,
        [field]: value
      }
    });
  };

  const handlePrimaryColorChange = (color: string) => {
    updateBranding('primaryColor', color);
  };

  const handleFontChange = (font: string) => {
    updateBranding('fontFamily', font);
  };

  const addCustomColor = () => {
    if (newColor && !customColors.includes(newColor)) {
      const updatedColors = [...customColors, newColor];
      setCustomColors(updatedColors);
      updateBranding('customColors', updatedColors);
      setNewColor('#000000');
    }
  };

  const removeCustomColor = (colorToRemove: string) => {
    const updatedColors = customColors.filter(color => color !== colorToRemove);
    setCustomColors(updatedColors);
    updateBranding('customColors', updatedColors);
  };

  const handleCustomColorChange = (oldColor: string, newColor: string) => {
    const updatedColors = customColors.map(color => color === oldColor ? newColor : color);
    setCustomColors(updatedColors);
    updateBranding('customColors', updatedColors);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">طراحی و برندینگ</h2>
        <p className="text-muted-foreground">
          رنگ‌ها و فونت وب‌سایت خود را انتخاب کنید
        </p>
      </div>

      {/* Primary Color Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">انتخاب رنگ اصلی</Label>
        </div>
        
        {/* Custom Primary Color Picker */}
        <div className="flex gap-3 items-center mb-4">
          <div className="relative">
            <Input
              type="color"
              value={data.branding?.primaryColor || '#8B5CF6'}
              onChange={(e) => handlePrimaryColorChange(e.target.value)}
              className="w-16 h-12 p-1 border-2 border-gray-200 rounded-lg cursor-pointer"
            />
          </div>
          <Input
            type="text"
            value={data.branding?.primaryColor || '#8B5CF6'}
            onChange={(e) => handlePrimaryColorChange(e.target.value)}
            placeholder="#000000"
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">رنگ سفارشی اصلی</span>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {predefinedColors.map((color) => (
            <Card
              key={color.value}
              className={`cursor-pointer transition-all duration-300 ${
                data.branding?.primaryColor === color.value
                  ? 'ring-2 ring-offset-2 ring-primary'
                  : 'hover:shadow-medium'
              }`}
              onClick={() => handlePrimaryColorChange(color.value)}
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

      {/* Custom Color Palette */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">پالت رنگ سفارشی</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          رنگ‌های سفارشی خود را اضافه کنید تا در طراحی استفاده کنید
        </p>
        
        {/* Add New Color */}
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-16 h-12 p-1 border-2 border-gray-200 rounded-lg cursor-pointer"
            />
          </div>
          <Input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="#000000"
            className="w-32"
          />
          <Button onClick={addCustomColor} size="sm">
            <Plus className="w-4 h-4" />
            اضافه کردن
          </Button>
        </div>

        {/* Custom Colors Display */}
        {customColors.length > 0 && (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {customColors.map((color, index) => (
              <div key={index} className="relative group">
                <div className="relative">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => handleCustomColorChange(color, e.target.value)}
                    className="w-12 h-12 p-1 border-2 border-gray-200 rounded-lg cursor-pointer"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCustomColor(color)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  {color}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Font Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">انتخاب فونت</Label>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonts.map((font) => (
            <Card
              key={font.value}
              className={`cursor-pointer transition-all duration-300 ${
                data.branding?.fontFamily === font.value
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:ring-1 hover:ring-primary/50 hover:shadow-medium'
              }`}
              onClick={() => handleFontChange(font.value)}
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

      {/* Color Preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">پیش‌نمایش رنگ‌ها</Label>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">رنگ اصلی:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: data.branding?.primaryColor || '#8B5CF6' }}
                />
                <span className="text-sm font-mono">{data.branding?.primaryColor || '#8B5CF6'}</span>
              </div>
            </div>
            
            {customColors.length > 0 && (
              <div>
                <span className="font-medium block mb-2">رنگ‌های سفارشی:</span>
                <div className="flex flex-wrap gap-2">
                  {customColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* File Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Files className="w-5 h-5 text-primary" />
          <Label className="text-lg font-semibold">فایل‌های پروژه</Label>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          فایل‌های مربوط به پروژه خود مانند محتوا، تصاویر، اسناد و ... را آپلود کنید
        </p>
        <FileUploadManager data={data} updateData={updateData} />
      </div>
    </div>
  );
};

export default StepThree;