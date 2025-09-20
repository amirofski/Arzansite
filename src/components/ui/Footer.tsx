import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Instagram, Linkedin, Github, Phone, Mail, Heart } from "lucide-react";
import BlackHoleBackground from "./BlackHoleBackground";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/arzansite" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/arzansite" },
  { icon: Github, label: "GitHub", href: "https://github.com/arzansite" },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative w-full mt-16 overflow-hidden">
      <BlackHoleBackground className="max-h-[350px]">
        <div className="relative z-50 w-full h-full flex flex-col justify-center">
          {/* Main Content */}
          <div className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
              {/* Brand */}
              <div className="flex items-center gap-3 order-1 lg:order-1">
                <img 
                  src="/logo.png" 
                  alt="Arzan Site Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl" 
                />
                <div className="flex flex-col rtl:text-right ltr:text-left">
                  <span className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                    ارزان سایت
                  </span>
                  <span className="text-xs sm:text-sm text-white/80 font-medium tracking-wide mt-0.5">
                    انسان + هوش مصنوعی = وب‌سایتی که برای رشد شما ساخته می‌شود
                  </span>
                </div>
              </div>

              {/* Socials */}
              <div className="flex items-center gap-3 sm:gap-4 order-2 lg:order-2">
                {socials.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-2 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </a>
                ))}
              </div>

              {/* Contact */}
              <div className="flex flex-col items-center lg:items-end gap-2 text-sm sm:text-base text-white/90 order-3 lg:order-3">
                <a 
                  href="tel:+9802191030981" 
                  className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm"
                >
                  <Phone className="w-4 h-4" /> 
                  <span className="hidden sm:inline">۰۲۱-۹۱۰۳-۰۹۸۱</span>
                  <span className="sm:hidden">تماس</span>
                </a>
                <a 
                  href="mailto:info@arzansite.com" 
                  className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm"
                >
                  <Mail className="w-4 h-4" /> 
                  <span className="hidden sm:inline">info@arzansite.com</span>
                  <span className="sm:hidden">ایمیل</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="relative z-50 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/20 pt-6">
                <span className="text-xs sm:text-sm text-white/70 text-center sm:text-left">
                  © {new Date().getFullYear()} ارزان سایت | Arzan Site. همه حقوق محفوظ است.
                </span>
                <span className="flex items-center gap-1 text-xs sm:text-sm text-white/70">
                  Made with <Heart className="w-4 h-4 text-red-400" /> in Iran
                </span>
              </div>
            </div>
          </div>
        </div>
      </BlackHoleBackground>
    </footer>
  );
};

export default Footer; 