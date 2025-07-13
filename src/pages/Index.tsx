import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  Palette, 
  Globe, 
  Shield, 
  Star, 
  Users, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Rocket
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'سریع و آسان',
      description: 'در کمتر از 10 دقیقه وب‌سایت خود را بسازید'
    },
    {
      icon: Palette,
      title: 'طراحی زیبا',
      description: 'قالب‌های مدرن و ریسپانسیو برای همه دستگاه‌ها'
    },
    {
      icon: Globe,
      title: 'دامنه رایگان',
      description: 'دامنه .ir برای یک سال کاملاً رایگان'
    },
    {
      icon: Shield,
      title: 'امن و قابل اعتماد',
      description: 'هاستینگ سریع و پشتیبانی 24/7'
    }
  ];

  const steps = [
    { number: 1, title: 'انتخاب نوع سایت', description: 'شخصی یا تجاری' },
    { number: 2, title: 'انتخاب صفحات', description: 'صفحات مورد نیاز' },
    { number: 3, title: 'طراحی و برندینگ', description: 'رنگ و لوگو' },
    { number: 4, title: 'محاسبه قیمت', description: 'شفاف و منصفانه' },
    { number: 5, title: 'اطلاعات شخصی', description: 'تماس و دامنه' },
    { number: 6, title: 'پرداخت امن', description: 'زرین‌پال' }
  ];

  const testimonials = [
    {
      name: 'علی احمدی',
      role: 'طراح گرافیک',
      content: 'در کمتر از یک ساعت وب‌سایت نمونه کارهایم آماده شد. فوق‌العاده!'
    },
    {
      name: 'مریم کریمی',
      role: 'صاحب کافه',
      content: 'وب‌سایت کافه‌ام حرفه‌ای و زیبا شد. مشتریان بیشتری جذب کردم.'
    },
    {
      name: 'حسن محمدی',
      role: 'مشاور املاک',
      content: 'پشتیبانی عالی و کیفیت بالا. به همه توصیه می‌کنم.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">سایت‌ساز فارسی</h1>
          </div>
          <Button 
            onClick={() => navigate('/wizard')}
            className="btn-gradient"
          >
            شروع کنید
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-primary bg-white/20 border-white/30">
              🚀 ساخت وب‌سایت در چند کلیک
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bounce-in">
              وب‌سایت رویایی خود را
              <br />
              <span className="text-accent">همین امروز بسازید</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 fade-in">
              بدون کدنویسی، بدون پیچیدگی - فقط چند قدم ساده
              <br />
              و وب‌سایت حرفه‌ای شما آماده است!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/wizard')}
                className="btn-accent text-lg px-8 py-4 shadow-strong hover:shadow-xl"
              >
                <Rocket className="w-5 h-5 ml-2" />
                همین الان شروع کنید
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                مشاهده نمونه‌ها
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>بدون پیش‌پرداخت</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>دامنه رایگان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>پشتیبانی 24/7</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">چرا ما را انتخاب کنید؟</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              با سایت‌ساز فارسی، ساخت وب‌سایت هیچ‌وقت آسان‌تر نبوده
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-modern text-center hover:shadow-strong transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">چطور کار می‌کند؟</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              فقط شش قدم تا وب‌سایت رویایی شما
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-medium">
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">نظرات مشتریان</h2>
            <p className="text-xl text-muted-foreground">
              ببینید دیگران چه می‌گویند
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-modern">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            آماده برای شروع هستید؟
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            همین امروز وب‌سایت خود را بسازید و حضور آنلاین قدرتمندی داشته باشید
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/wizard')}
            className="btn-accent text-lg px-8 py-4 shadow-strong hover:shadow-xl"
          >
            <Rocket className="w-5 h-5 ml-2" />
            شروع رایگان
          </Button>
          <p className="text-sm text-white/70 mt-4">
            ⭐ بدون هیچ تعهدی - اگر راضی نبودید، پول‌تان را برمی‌گردانیم
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold">سایت‌ساز فارسی</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                ساخت وب‌سایت حرفه‌ای در چند کلیک
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">خدمات</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>ساخت وب‌سایت شخصی</li>
                <li>ساخت وب‌سایت تجاری</li>
                <li>طراحی لوگو</li>
                <li>هاستینگ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">پشتیبانی</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>راهنمای کاربری</li>
                <li>سوالات متداول</li>
                <li>تماس با ما</li>
                <li>گزارش مشکل</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">تماس</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>ایمیل: info@sitesaz.ir</li>
                <li>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
                <li>آدرس: تهران، ایران</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© ۱۴۰۳ سایت‌ساز فارسی. تمام حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
