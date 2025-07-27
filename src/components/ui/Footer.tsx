import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Instagram, Linkedin, Github, Phone, Mail, Heart } from "lucide-react";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/arzansite" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/arzansite" },
  { icon: Github, label: "GitHub", href: "https://github.com/arzansite" },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative w-full bg-white/30 backdrop-blur-xl border-t border-white/20 shadow-inner mt-16 z-10 overflow-hidden">
      {/* Animated background shapes */}
      <motion.div
        className="absolute -top-10 left-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl z-0"
        animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl z-0"
        animate={{ y: [0, -20, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col rtl:text-right ltr:text-left">
            <span className="text-xl font-extrabold text-primary leading-tight">ارزان سایت</span>
            <span className="text-xs text-accent font-semibold tracking-wide mt-0.5">Arzan Site - بهترین سایت‌ساز ایران</span>
          </div>
        </div>
        {/* Socials */}
        <div className="flex items-center gap-4">
          {socials.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 hover:bg-accent/20 transition-colors"
              aria-label={label}
            >
              <Icon className="w-5 h-5 text-accent" />
            </a>
          ))}
        </div>
        {/* Contact */}
        <div className="flex flex-col items-center md:items-end gap-1 text-sm text-muted-foreground">
          <a href="tel:+989123456789" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Phone className="w-4 h-4" /> ۰۲۱-۹۱۰۳-۰۹۸۱
          </a>
          <a href="mailto:info@arzansite.com" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Mail className="w-4 h-4" /> info@arzansite.com
          </a>
        </div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-6 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-white/10 pt-4">
        <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} ارزان سایت | Arzan Site. همه حقوق محفوظ است.</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          Made with <Heart className="w-4 h-4 text-red-500" /> in Iran
        </span>
      </div>
    </footer>
  );
};

export default Footer; 