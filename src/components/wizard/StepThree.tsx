import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Palette, Type, Files } from 'lucide-react';
import FileUploadManager from './FileUploadManager';

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

      {/* Dynamic Design Preview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">پیش‌نمایش طراحی پویا</h3>
          <div className="space-y-4">
            {/* Page Structure Info */}
            {data.websiteFramework?.dynamicDesign?.pages && (
              <div className="text-sm text-muted-foreground mb-4">
                <span className="font-medium">نوع سایت:</span> 
                {data.websiteFramework.dynamicDesign.pages.length === 1 ? ' تک صفحه‌ای' : ' چند صفحه‌ای'}
                <span className="mr-2">
                  <span className="font-medium mr-1">صفحات:</span>
                  {data.websiteFramework.dynamicDesign.pages.map(page => page.name).join('، ')}
                </span>
              </div>
            )}
            
            {/* Dynamic Design Preview */}
            {data.websiteFramework?.dynamicDesign?.pages ? (
              <div className="space-y-6">
                {data.websiteFramework.dynamicDesign.pages.map((page, pageIndex) => (
                  <div key={page.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{page.name}</h4>
                      <span className="text-sm text-muted-foreground">({page.sections.length} بخش)</span>
                    </div>
                    
                    <div 
                      className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
                      style={{ fontFamily: data.branding?.fontFamily }}
                    >
                      {page.sections.length > 0 ? (
                        <div className="space-y-0">
                          {page.sections.map((section, sectionIndex) => (
                            <div key={section.id} className="border-b border-gray-100 last:border-b-0">
                              {/* Header Section */}
                              {section.sectionType === 'header' && (
                                <div 
                                  className="w-full h-20 bg-gray-100 border-b-2 flex items-center justify-between px-6"
                                  style={{ borderColor: data.branding?.primaryColor }}
                                >
                                  <div className="flex items-center gap-4">
                                    {logoPreview && (
                                      <img src={logoPreview} alt="Logo" className="w-10 h-10 rounded" />
                                    )}
                                    <div className="w-32 h-6 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="w-16 h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                    <div className="w-16 h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                    <div className="w-16 h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                  </div>
                                </div>
                              )}

                              {/* Hero Section */}
                              {section.sectionType === 'hero' && (
                                <div className="w-full h-64 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-center relative">
                                  <div className="text-center space-y-4">
                                    <div 
                                      className="w-64 h-8 bg-gray-200 rounded mx-auto"
                                      style={{ backgroundColor: data.branding?.primaryColor + '20' }}
                                    ></div>
                                    <div className="w-96 h-4 bg-gray-200 rounded mx-auto" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                    <div className="flex gap-4 justify-center">
                                      <div 
                                        className="w-24 h-10 rounded"
                                        style={{ backgroundColor: data.branding?.primaryColor }}
                                      ></div>
                                      <div className="w-24 h-10 bg-gray-200 rounded border"></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* About Section */}
                              {section.sectionType === 'about' && (
                                <div className="w-full py-12 px-6 bg-white">
                                  <div className="max-w-4xl mx-auto">
                                    <div 
                                      className="w-48 h-6 bg-gray-200 rounded mb-6 mx-auto"
                                      style={{ backgroundColor: data.branding?.primaryColor + '20' }}
                                    ></div>
                                    <div className="grid md:grid-cols-2 gap-8 items-center">
                                      <div className="space-y-4">
                                        <div className="w-full h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        <div className="w-3/4 h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        <div className="w-1/2 h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                      </div>
                                      <div className="w-full h-48 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Services Section */}
                              {section.sectionType === 'services' && (
                                <div className="w-full py-12 px-6 bg-gray-50">
                                  <div className="max-w-4xl mx-auto">
                                    <div 
                                      className="w-48 h-6 bg-gray-200 rounded mb-6 mx-auto"
                                      style={{ backgroundColor: data.branding?.primaryColor + '20' }}
                                    ></div>
                                    <div className="grid md:grid-cols-3 gap-6">
                                      {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                                          <div className="w-12 h-12 bg-gray-200 rounded mb-4" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                          <div className="w-24 h-4 bg-gray-200 rounded mb-2" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                          <div className="w-full h-3 bg-gray-200 rounded mb-1" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                          <div className="w-2/3 h-3 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Contact Section */}
                              {section.sectionType === 'contact' && (
                                <div className="w-full py-12 px-6 bg-white">
                                  <div className="max-w-4xl mx-auto">
                                    <div 
                                      className="w-48 h-6 bg-gray-200 rounded mb-6 mx-auto"
                                      style={{ backgroundColor: data.branding?.primaryColor + '20' }}
                                    ></div>
                                    <div className="grid md:grid-cols-2 gap-8">
                                      <div className="space-y-4">
                                        <div className="w-full h-10 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        <div className="w-full h-10 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        <div className="w-full h-32 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        <div 
                                          className="w-24 h-10 rounded"
                                          style={{ backgroundColor: data.branding?.primaryColor }}
                                        ></div>
                                      </div>
                                      <div className="w-full h-64 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Newsletter Section */}
                              {section.sectionType === 'newsletter' && (
                                <div className="w-full py-12 px-6 bg-gray-50">
                                  <div className="max-w-2xl mx-auto text-center">
                                    <div 
                                      className="w-48 h-6 bg-gray-200 rounded mb-4 mx-auto"
                                      style={{ backgroundColor: data.branding?.primaryColor + '20' }}
                                    ></div>
                                    <div className="w-96 h-4 bg-gray-200 rounded mb-6 mx-auto" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                    <div className="flex gap-4 justify-center">
                                      <div className="w-64 h-10 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                      <div 
                                        className="w-24 h-10 rounded"
                                        style={{ backgroundColor: data.branding?.primaryColor }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Footer Section */}
                              {section.sectionType === 'footer' && (
                                <div 
                                  className="w-full py-8 px-6 bg-gray-800"
                                  style={{ backgroundColor: data.branding?.primaryColor + '10' }}
                                >
                                  <div className="max-w-4xl mx-auto">
                                    <div className="grid md:grid-cols-4 gap-6">
                                      <div className="space-y-3">
                                        <div className="w-32 h-6 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                        <div className="w-24 h-3 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                        <div className="w-20 h-3 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                      </div>
                                      {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-3">
                                          <div className="w-20 h-4 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '20' }}></div>
                                          <div className="w-16 h-3 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                          <div className="w-16 h-3 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                          <div className="w-16 h-3 bg-gray-200 rounded" style={{ backgroundColor: data.branding?.primaryColor + '10' }}></div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-50 flex items-center justify-center">
                          <p className="text-muted-foreground">این صفحه هنوز بخشی ندارد</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-50 flex items-center justify-center rounded-lg">
                <p className="text-muted-foreground">طراحی پویا انتخاب نشده است</p>
              </div>
            )}

            {/* Branding Applied Info */}
            <div className="mt-6 p-4 bg-primary/5 rounded-lg">
              <h4 className="font-semibold mb-2">برندینگ اعمال شده:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">رنگ اصلی:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: data.branding?.primaryColor }}
                    ></div>
                    <span>{data.branding?.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">فونت:</span>
                  <span className="block mt-1">{fonts.find(f => f.value === data.branding?.fontFamily)?.name || data.branding?.fontFamily}</span>
                </div>
                <div>
                  <span className="font-medium">لوگو:</span>
                  <span className="block mt-1">{logoPreview ? 'آپلود شده' : 'آپلود نشده'}</span>
                </div>
                <div>
                  <span className="font-medium">بخش‌های انتخاب شده:</span>
                  <span className="block mt-1">
                    {data.websiteFramework?.dynamicDesign?.pages ? 
                      data.websiteFramework.dynamicDesign.pages.reduce((total, page) => total + page.sections.length, 0) : 0} بخش
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepThree;