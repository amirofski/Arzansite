import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Users, Mail, FileText, ShoppingBag, Star } from 'lucide-react';

interface StepTwoProps {
  data: any;
  updateData: (data: any) => void;
}

const StepTwo = ({ data, updateData }: StepTwoProps) => {
  const personalPages = [
    { id: 'home', name: 'صفحه اصلی', icon: Home, required: true, description: 'معرفی اولیه و نمای کلی' },
    { id: 'about', name: 'درباره من', icon: Users, required: false, description: 'معرفی شخصی و رزومه' },
    { id: 'portfolio', name: 'نمونه کارها', icon: Star, required: false, description: 'نمایش پروژه‌ها و کارها' },
    { id: 'blog', name: 'وبلاگ', icon: FileText, required: false, description: 'نوشتن مقالات و تجربیات' },
    { id: 'contact', name: 'تماس با من', icon: Mail, required: true, description: 'راه‌های ارتباطی' },
  ];

  const businessPages = [
    { id: 'home', name: 'صفحه اصلی', icon: Home, required: true, description: 'معرفی کسب‌وکار' },
    { id: 'about', name: 'درباره ما', icon: Users, required: false, description: 'تاریخچه و معرفی شرکت' },
    { id: 'services', name: 'خدمات', icon: Star, required: false, description: 'معرفی خدمات و محصولات' },
    { id: 'products', name: 'محصولات', icon: ShoppingBag, required: false, description: 'نمایش محصولات' },
    { id: 'team', name: 'تیم ما', icon: Users, required: false, description: 'معرفی اعضای تیم' },
    { id: 'contact', name: 'تماس با ما', icon: Mail, required: true, description: 'اطلاعات تماس و آدرس' },
  ];

  const pages = data.siteType === 'personal' ? personalPages : businessPages;

  const togglePage = (pageId: string) => {
    const currentPages = data.pages || [];
    const isSelected = currentPages.includes(pageId);
    
    if (isSelected) {
      // Don't allow removing required pages
      const page = pages.find(p => p.id === pageId);
      if (page?.required) return;
      
      updateData({ 
        pages: currentPages.filter((id: string) => id !== pageId) 
      });
    } else {
      updateData({ 
        pages: [...currentPages, pageId] 
      });
    }
  };

  // Add required pages by default
  if (!data.pages || data.pages.length === 0) {
    const requiredPages = pages.filter(p => p.required).map(p => p.id);
    updateData({ pages: requiredPages });
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">صفحات وب‌سایت را انتخاب کنید</h2>
        <p className="text-muted-foreground">
          صفحاتی که نیاز دارید انتخاب کنید. صفحات ضروری به‌طور خودکار اضافه شده‌اند
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => {
          const isSelected = data.pages?.includes(page.id);
          const Icon = page.icon;
          
          return (
            <Card
              key={page.id}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:ring-1 hover:ring-primary/50 hover:shadow-medium'
              }`}
              onClick={() => togglePage(page.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{page.name}</h3>
                      {page.required && (
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                          ضروری
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {page.description}
                    </p>
                    <div className="mt-3">
                      <Checkbox 
                        checked={isSelected} 
                        disabled={page.required}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.pages && data.pages.length > 0 && (
        <div className="text-center mt-8 p-4 bg-success/10 rounded-xl border border-success/20">
          <p className="text-success font-medium">
            ✓ {data.pages.length} صفحه انتخاب شده
          </p>
        </div>
      )}
    </div>
  );
};

export default StepTwo;