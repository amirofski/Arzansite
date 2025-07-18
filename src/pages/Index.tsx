import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Rocket,
  Zap,
  Code,
  DollarSign,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';
import Layout from "@/components/ui/Layout";

const SLIDE_COUNT = 6; // Update if you add/remove slides
const SCROLL_LOCK_DURATION = 900; // ms, should match Framer Motion transition

const Index = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const navigate = useNavigate();

  // Scroll event handler for slide navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollLocked) return;
      if (Math.abs(e.deltaY) < 30) return; // Ignore small scrolls
      if (e.deltaY > 0) {
        // Scroll down
        if (activeSlide < SLIDE_COUNT - 1) {
          setScrollLocked(true);
          setActiveSlide((prev) => prev + 1);
          setTimeout(() => setScrollLocked(false), SCROLL_LOCK_DURATION);
        }
      } else if (e.deltaY < 0) {
        // Scroll up
        if (activeSlide > 0) {
          setScrollLocked(true);
          setActiveSlide((prev) => prev - 1);
          setTimeout(() => setScrollLocked(false), SCROLL_LOCK_DURATION);
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [scrollLocked, activeSlide]);

  // Keyboard navigation (optional, for accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scrollLocked) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (activeSlide < SLIDE_COUNT - 1) {
          setScrollLocked(true);
          setActiveSlide((prev) => prev + 1);
          setTimeout(() => setScrollLocked(false), SCROLL_LOCK_DURATION);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (activeSlide > 0) {
          setScrollLocked(true);
          setActiveSlide((prev) => prev - 1);
          setTimeout(() => setScrollLocked(false), SCROLL_LOCK_DURATION);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollLocked, activeSlide]);

  useEffect(() => {
    // Hide browser scroll bar
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Slide component with Framer Motion and inView
  const Slide = ({ children, id, index }: { children: React.ReactNode; id: string; index: number }) => (
    <motion.section
      id={id}
      className="min-h-screen w-full flex items-center justify-center relative"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </motion.section>
  );

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
      {/* All slides and main content here, no header or NavigationDots */}
      {/* Slide 1: Overview */}
      <AnimatePresence mode="wait" initial={false}>
        {activeSlide === 0 && (
          <Slide key={0} id="slide-0" index={0}>
            <div className="hero-gradient min-h-screen w-full flex items-center justify-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/30 w-full"></div>
              <div className="max-w-6xl mx-auto px-6 text-center relative z-10 w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="max-w-4xl mx-auto"
                >
                  <motion.h1 
                    className="text-6xl md:text-8xl font-bold mb-8"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    ارزان سایت
                  </motion.h1>
                  
                  {/* Animated subtitle with typewriter effect */}
                  <motion.div 
                    className="text-xl md:text-2xl mb-8 text-accent font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.0 }}
                  >
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: "auto" }}
                      transition={{ duration: 1.5, delay: 1.2 }}
                      className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-accent"
                    >
                      Arzansite.com - بهترین سایت‌ساز ایران
                    </motion.span>
                  </motion.div>
                  
                  <motion.p 
                    className="text-2xl md:text-3xl mb-12 text-white/90 leading-relaxed"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    سایت‌ساز فوق‌آسان با طراحی و کد سفارشی، سئو بی‌نظیر، سرعت بالا، 
                    <br />
                    اپتایم ۲۴/۷، پرداخت امن آنلاین، سورس کامل
                    <br />
                    <span className="text-accent font-bold">تنها ۲,۵۰۰,۰۰۰ تومان در ماه</span>
                  </motion.p>
                  
                  {/* Animated features grid */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                  >
                    {[
                      { icon: "⚡", title: "تحویل فوری", desc: "کمتر از ۲۴ ساعت" },
                      { icon: "🎨", title: "طراحی منحصر", desc: "۱۰۰٪ سفارشی" },
                      { icon: "🔒", title: "امنیت کامل", desc: "SSL + CDN رایگان" }
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.6 + index * 0.2 }}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                      >
                        <div className="text-3xl mb-2">{feature.icon}</div>
                        <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                        <p className="text-sm text-white/80">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  {/* Call to action button */}
                  <motion.div
                    className="mb-12"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 2.4 }}
                  >
                    <motion.button
                      onClick={() => navigate('/wizard')}
                      className="px-10 py-4 bg-accent text-black text-xl font-bold rounded-xl shadow-2xl hover:shadow-accent/50 transition-all duration-300"
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(var(--accent), 0.5)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="flex items-center gap-2">
                        <Rocket className="w-6 h-6" />
                        همین الان شروع کنید
                      </span>
                    </motion.button>
                  </motion.div>
                  
                  <motion.div
                    className="flex items-center justify-center gap-8 text-white/80"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="w-6 h-6 text-accent" />
                      <span className="text-lg">طراحی سفارشی</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="w-6 h-6 text-accent" />
                      <span className="text-lg">سئو حرفه‌ای</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="w-6 h-6 text-accent" />
                      <span className="text-lg">سورس کامل</span>
                    </motion.div>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowDown className="w-6 h-6 text-white/70" />
                </motion.div>
              </div>
              
              {/* Floating Elements */}
              <motion.div 
                className="absolute top-20 left-20 w-32 h-32 bg-accent/20 rounded-full blur-xl"
                animate={{ 
                  y: [-20, 20, -20],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-32 right-16 w-40 h-40 bg-secondary/20 rounded-full blur-xl"
                animate={{ 
                  y: [20, -20, 20],
                  scale: [1.1, 1, 1.1]
                }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
            </div>
          </Slide>
        )}
        {activeSlide === 1 && (
          <Slide key={1} id="slide-1" index={1}>
            <div className="min-h-screen w-full bg-gradient-to-br from-muted/30 to-background flex items-center">
              <div className="max-w-6xl mx-auto px-6 w-full">
                <div className="text-center mb-16">
                  <h2 className="text-5xl font-bold mb-6">فرآیند کار</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    سه قدم ساده تا راه‌اندازی وب‌سایت شما
                  </p>
                </div>
                <div className="max-w-6xl mx-auto">
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
                        transition={{ duration: 0.6, delay: index * 0.2 }}
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
              </div>
            </div>
          </Slide>
        )}
        {activeSlide === 2 && (
          <Slide key={2} id="slide-2" index={2}>
            <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center">
              <div className="max-w-6xl mx-auto px-6 w-full">
                <div className="max-w-4xl mx-auto text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <Code className="w-24 h-24 text-primary mx-auto mb-8" />
                    <h2 className="text-5xl font-bold mb-8">تکنولوژی پیشرفته</h2>
                    <p className="text-2xl text-muted-foreground mb-12 leading-relaxed">
                      تمام سایت‌ها به‌صورت استاتیک روی Vercel دیپلوی می‌شوند. 
                      <br />
                      پشتیبانی از سایت‌های داینامیک به زودی اضافه خواهد شد.
                    </p>
                  </motion.div>
                  
                  <div className="grid md:grid-cols-3 gap-8 mt-16">
                    {[
                      {
                        icon: Zap,
                        title: "سرعت فوق‌العاده",
                        description: "بارگیری در کمتر از ۱ ثانیه"
                      },
                      {
                        icon: Globe,
                        title: "CDN جهانی",
                        description: "دسترسی سریع از هر نقطه دنیا"
                      },
                      {
                        icon: Code,
                        title: "React & TypeScript",
                        description: "جدیدترین تکنولوژی‌های وب"
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                      >
                        <item.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Slide>
        )}
        {activeSlide === 3 && (
          <Slide key={3} id="slide-3" index={3}>
            <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/30 flex items-center">
              <div className="max-w-6xl mx-auto px-6 w-full">
                <div className="max-w-4xl mx-auto text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <Shield className="w-24 h-24 text-green-500 mx-auto mb-8" />
                    <h2 className="text-5xl font-bold mb-8">امنیت بالا</h2>
                    <p className="text-2xl text-muted-foreground mb-12 leading-relaxed">
                      معماری استاتیک + CDN + HTTPS = سایت تقریباً غیرقابل هک
                    </p>
                  </motion.div>
                  
                  <div className="grid md:grid-cols-2 gap-12 mt-16">
                    {[
                      {
                        icon: Shield,
                        title: "محافظت کامل",
                        description: "بدون پایگاه داده یا سرور، بدون نقطه ضعف امنیتی",
                        features: ["SSL رایگان", "حفاظت DDoS", "بکاپ خودکار"]
                      },
                      {
                        icon: Clock,
                        title: "اپتایم ۹۹.۹۹٪",
                        description: "سرویس پایدار و قابل اعتماد ۲۴ ساعته",
                        features: ["مانیتورینگ مداوم", "سرور چندگانه", "پشتیبانی ۲۴/۷"]
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="bg-white p-8 rounded-2xl shadow-lg"
                        initial={{ x: index === 0 ? -50 : 50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                      >
                        <item.icon className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                        <p className="text-muted-foreground mb-6">{item.description}</p>
                        <ul className="space-y-2">
                          {item.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Slide>
        )}
        {activeSlide === 4 && (
          <Slide key={4} id="slide-4" index={4}>
            <div className="min-h-screen w-full hero-gradient text-white flex items-center">
              <div className="max-w-6xl mx-auto px-6 w-full">
                <div className="max-w-4xl mx-auto text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <DollarSign className="w-24 h-24 text-accent mx-auto mb-8" />
                    <h2 className="text-5xl font-bold mb-8">قیمت و ارزش</h2>
                    <div className="text-6xl font-bold text-accent mb-4">۲,۵۰۰,۰۰۰</div>
                    <p className="text-2xl mb-8">تومان در ماه</p>
                    <p className="text-xl text-white/90 mb-12 leading-relaxed">
                      برای یک سایت React کاملاً سفارشی - شامل طراحی، تیم توسعه و هاستینگ مداوم
                      <br />
                      <span className="font-bold text-accent">بدون هزینه مخفی</span>
                    </p>
                  </motion.div>
                  
                  <div className="grid md:grid-cols-3 gap-8 mt-16">
                    {[
                      {
                        icon: Target,
                        title: "طراحی سفارشی",
                        description: "طراحی منحصر به فرد برای برند شما"
                      },
                      {
                        icon: Users,
                        title: "تیم توسعه",
                        description: "تیم حرفه‌ای برنامه‌نویسان React"
                      },
                      {
                        icon: Globe,
                        title: "هاستینگ ابری",
                        description: "هاستینگ پرسرعت روی Vercel"
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20"
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <item.icon className="w-12 h-12 text-accent mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-white/80">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Slide>
        )}
        {activeSlide === 5 && (
          <Slide key={5} id="slide-5" index={5}>
            <div className="min-h-screen w-full bg-gradient-to-br from-muted/30 to-background flex items-center">
              <div className="max-w-6xl mx-auto px-6 w-full">
                <div className="max-w-6xl mx-auto text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <TrendingUp className="w-24 h-24 text-primary mx-auto mb-8" />
                    <h2 className="text-5xl font-bold mb-8">اعتماد مشتریان</h2>
                    <p className="text-xl text-muted-foreground mb-16">
                      آمار و ارقامی که از کیفیت خدمات ما حکایت می‌کند
                    </p>
                  </motion.div>
                  
                  <div className="grid md:grid-cols-3 gap-12 mb-16">
                    {[
                      {
                        number: "۱,۰۰۰+",
                        label: "مشتری راضی",
                        icon: Users
                      },
                      {
                        number: "۹۹.۹۹٪",
                        label: "اپتایم سرور",
                        icon: TrendingUp
                      },
                      {
                        number: "۵۰۰+",
                        label: "پروژه تحویلی",
                        icon: CheckCircle
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        className="text-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        viewport={{ once: true }}
                      >
                        <stat.icon className="w-16 h-16 text-primary mx-auto mb-4" />
                        <div className="text-5xl font-bold text-primary mb-2">{stat.number}</div>
                        <p className="text-xl text-muted-foreground">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl mx-auto"
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-1 justify-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-xl text-muted-foreground italic mb-6">
                      "تیم ارزان سایت در کمتر از ۲۴ ساعت وب‌سایت فروشگاهم را آماده کرد. 
                      کیفیت طراحی و سرعت بارگیری فوق‌العاده بود!"
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

                  <motion.div
                    className="mt-16"
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    viewport={{ once: true }}
                  >
                    <button 
                      onClick={() => navigate('/wizard')}
                      className="px-12 py-4 bg-primary text-white text-xl font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xl hover:shadow-2xl"
                    >
                      همین امروز شروع کنید
                    </button>
                    <p className="text-sm text-muted-foreground mt-4">
                      ⭐ تضمین بازگشت وجه در صورت عدم رضایت
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </Slide>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Index;
