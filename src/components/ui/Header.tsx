import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Instagram, Linkedin, Github, Phone, Mail, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/arzansite" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/arzansite" },
  { icon: Github, label: "GitHub", href: "https://github.com/arzansite" },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  return (
    <motion.header
      className="fixed top-0 w-full z-50 bg-white/30 backdrop-blur-xl border-b border-white/20 shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex justify-between items-center gap-4">
        {/* Logo & Brand */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 group focus:outline-none"
          aria-label="بازگشت به خانه"
          tabIndex={0}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <motion.div
            className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-6 transition-transform"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
          <div className="flex flex-col rtl:text-right ltr:text-left">
            <span className="text-2xl font-extrabold text-primary leading-tight">ارزان سایت</span>
            <span className="text-xs text-accent font-semibold tracking-wide mt-0.5">Arzan Site - بهترین سایت‌ساز ایران</span>
          </div>
        </button>
        {/* Socials (desktop) */}
        <div className="hidden md:flex items-center gap-3">
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
        {/* CTA & Contact */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/wizard")}
            className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors text-base"
          >
            شروع کنید
          </button>
          <a href="tel:+989123456789" className="hidden md:inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm px-2">
            <Phone className="w-4 h-4" /> 0912-345-6789
          </a>
          <a href="mailto:info@arzansite.com" className="hidden md:inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm px-2">
            <Mail className="w-4 h-4" /> info@arzansite.com
          </a>
        </div>
        {/* Mobile menu/socials */}
        <div className="md:hidden flex items-center gap-2">
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
      </div>
    </motion.header>
  );
};

export default Header; 