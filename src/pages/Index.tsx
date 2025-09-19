import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/siteConfig";
import { 
  Globe, 
  Shield, 
  Star, 
  Users, 
  ArrowDown,
  CheckCircle,
  Rocket,
  Zap,
  Code,
  DollarSign,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';
import Layout from "@/components/ui/Layout";
import DotWave3D from "@/components/hero/DotWave3D";
import { Button } from "@/components/ui/button";


const Index = () => {
  const navigate = useNavigate();


  useEffect(() => {
    // Ensure normal scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);


  return (
    <Layout>
      <Helmet>
        <title>{siteConfig.seo.defaultTitle}</title>
        <meta name="description" content={siteConfig.seo.defaultDescription} />
        <meta name="keywords" content={siteConfig.keywords.join(", ")} />
        <link rel="canonical" href={siteConfig.seo.siteUrl} />
        {/* Open Graph */}
        <meta property="og:title" content={siteConfig.seo.defaultTitle} />
        <meta property="og:description" content={siteConfig.seo.defaultDescription} />
        <meta property="og:type" content={siteConfig.seo.type} />
        <meta property="og:url" content={siteConfig.seo.siteUrl} />
        <meta property="og:image" content={siteConfig.seo.defaultImage} />
        <meta property="og:locale" content={siteConfig.seo.locale} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteConfig.seo.defaultTitle} />
        <meta name="twitter:description" content={siteConfig.seo.defaultDescription} />
        <meta name="twitter:image" content={siteConfig.seo.defaultImage} />
        <meta name="twitter:site" content={siteConfig.seo.twitter} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-[linear-gradient(180deg,#0b1029,#070b1d)] text-white">
        <DotWave3D className="absolute inset-0 z-0 pointer-events-none" density={{ x: 96, y: 56 }} amplitude={0.9} speed={0.25} parallax={{ mouse: 0.06, scroll: 40 }} />
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <motion.p className="text-accent font-semibold tracking-wide mb-3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
              ArzanSite — انسان + هوش مصنوعی
            </motion.p>
            <motion.h1 className="text-4xl md:text-6xl font-extrabold leading-[1.15] mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.05 }}>
              سایت حرفه‌ای با طراحی سفارشی و سئوی قدرتمند
            </motion.h1>
            <motion.p className="text-white/90 text-lg md:text-xl leading-8 mb-7 max-w-2xl" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.15 }}>
              سایت‌ساز فوق‌سریع با مالکیت سورس کامل، بهینه برای Core Web Vitals و رشد ارگانیک. از استارتاپ تا برند؛ آمادهٔ اسکیل.
              <span className="font-bold text-accent"> تحویل فوری زیر ۲۴ ساعت.</span>
            </motion.p>
            <motion.ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white/90 mb-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }}>
              {[
                "SSL و CDN رایگان",
                "دیپلوی روی Vercel",
                "پشتیبانی ۲۴/۷",
                "پرداخت امن و مالکیت ۱۰۰٪ سورس",
              ].map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>{t}</span>
                </li>
              ))}
            </motion.ul>
            <motion.div className="flex items-center gap-3" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }}>
              <Button className="px-6 py-3 text-base font-bold bg-accent text-black hover:opacity-90" onClick={() => navigate('/wizard')}>
                شروع رایگان
              </Button>
              <Button variant="outline" className="px-6 py-3 text-base font-bold bg-white/10 text-white border-white/30 hover:bg-white/20" onClick={() => navigate('/contact')}>
                صحبت با تیم فروش
              </Button>
            </motion.div>
          </div>
          <motion.div className="relative" initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02 }} style={{ transformStyle: 'preserve-3d' }}>
            <img src="/index-banner.png" alt="پیش‌نمایش رابط کاربری ارزان‌سایت" className="w-full h-auto" />
          </motion.div>
        </div>
        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} aria-hidden="true">
          <ArrowDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Sections below hero */}
      {/* Process Section */}
      <section className="relative py-20 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">فرآیند کار</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              سه قدم ساده تا راه‌اندازی وب‌سایت شما
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: 1,
                icon: Globe,
                title: "انتخاب دامنه و قالب",
                description: "دامنه دلخواه و قالب مناسب کسب‌وکارتان را انتخاب کنید"
              },
              {
                step: 2,
                icon: DollarSign,
                title: "پرداخت آنلاین",
                description: "پرداخت امن و سریع از طریق درگاه‌های معتبر"
              },
              {
                step: 3,
                icon: Rocket,
                title: "راه‌اندازی سایت",
                description: "سایت استاتیک شما در کمتر از یک روز آماده می‌شود"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-8">
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto shadow-xl"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="text-center mt-16"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-xl font-semibold text-primary">
              شما ۱۰۰٪ مالک سایت خود خواهید بود
            </p>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <Code className="w-20 h-20 text-primary mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">تکنولوژی پیشرفته</h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                تمام سایت‌ها به‌صورت استاتیک روی Vercel دیپلوی می‌شوند. پشتیبانی از سایت‌های داینامیک به زودی اضافه خواهد شد.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8 mt-10">
              {[
                { icon: Zap, title: "سرعت فوق‌العاده", description: "بارگیری در کمتر از ۱ ثانیه" },
                { icon: Globe, title: "CDN جهانی", description: "دسترسی سریع از هر نقطه دنیا" },
                { icon: Code, title: "React & TypeScript", description: "جدیدترین تکنولوژی‌های وب" },
              ].map((item, index) => (
                <motion.div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow" initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ y: -5 }}>
                  <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative py-24 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <Shield className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">امنیت بالا</h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">معماری استاتیک + CDN + HTTPS = سایت تقریباً غیرقابل هک</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-12 mt-10">
              {[
                { icon: Shield, title: "محافظت کامل", description: "بدون پایگاه داده یا سرور، بدون نقطه ضعف امنیتی", features: ["SSL رایگان", "حفاظت DDoS", "بکاپ خودکار"] },
                { icon: Clock, title: "اپتایم ۹۹.۹۹٪", description: "سرویس پایدار و قابل اعتماد ۲۴ ساعته", features: ["مانیتورینگ مداوم", "سرور چندگانه", "پشتیبانی ۲۴/۷"] },
              ].map((item, index) => (
                <motion.div key={index} className="bg-white p-8 rounded-2xl shadow-lg" initial={{ x: index === 0 ? -40 : 40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                  <item.icon className="w-14 h-14 text-green-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground mb-6">{item.description}</p>
                  <ul className="space-y-2">
                    {item.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 hero-gradient text-white">
        <div className="max-w-6xl mx-auto px-6 w-full text-center">
          <motion.div initial={{ scale: 0.98, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <DollarSign className="w-20 h-20 text-accent mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-4">قیمت و ارزش</h2>
            <div className="text-5xl md:text-6xl font-bold text-accent mb-2">۲,۵۰۰,۰۰۰</div>
            <p className="text-xl">تومان در ماه</p>
            <p className="text-lg md:text-xl text-white/90 mt-8 leading-relaxed">
              برای یک سایت React کاملاً سفارشی - شامل طراحی، تیم توسعه و هاستینگ مداوم
              <br />
              <span className="font-bold text-accent">بدون هزینه مخفی</span>
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: Target, title: "طراحی سفارشی", description: "طراحی منحصر به فرد برای برند شما" },
              { icon: Users, title: "تیم توسعه", description: "تیم حرفه‌ای برنامه‌نویسان React" },
              { icon: Globe, title: "هاستینگ ابری", description: "هاستینگ پرسرعت روی Vercel" },
            ].map((item, index) => (
              <motion.div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20" initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ scale: 1.03 }}>
                <item.icon className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/80">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative py-24 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-6xl mx-auto px-6 w-full text-center">
          <motion.div initial={{ scale: 0.98, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <TrendingUp className="w-20 h-20 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-4">اعتماد مشتریان</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-12">آمار و ارقامی که از کیفیت خدمات ما حکایت می‌کند</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {[
              { number: "۱,۰۰۰+", label: "مشتری راضی", icon: Users },
              { number: "۹۹.۹۹٪", label: "اپتایم سرور", icon: TrendingUp },
              { number: "۵۰۰+", label: "پروژه تحویلی", icon: CheckCircle },
            ].map((stat, index) => (
              <motion.div key={index} className="text-center" initial={{ scale: 0.92, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: index * 0.15 }} viewport={{ once: true }}>
                <stat.icon className="w-16 h-16 text-primary mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-lg md:text-xl text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto" initial={{ y: 40, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }}>
            <div className="flex items-center gap-1 justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-lg md:text-xl text-muted-foreground italic mb-6">
              "تیم ارزان سایت در کمتر از ۲۴ ساعت وب‌سایت فروشگاهم را آماده کرد. کیفیت طراحی و سرعت بارگیری فوق‌العاده بود!"
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">سارا احمدی</p>
                <p className="text-sm text-muted-foreground">مدیر فروشگاه آنلاین</p>
              </div>
            </div>
          </motion.div>
          <motion.div className="mt-16" initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }}>
            <button onClick={() => navigate('/wizard')} className="px-10 py-3 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl">
              همین امروز شروع کنید
            </button>
            <p className="text-sm text-muted-foreground mt-3">⭐ تضمین بازگشت وجه در صورت عدم رضایت</p>
          </motion.div>
        </div>
      </section>

      {/* Debug components moved to /debug */}

    </Layout>
  );
};

export default Index;
