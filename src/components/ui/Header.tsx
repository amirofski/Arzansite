import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, Linkedin, Github, Phone, Mail, Menu, User, LogOut, Shield, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
// Removed direct Supabase usage; user role is provided by useAuth
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsBell } from "@/components/ui/NotificationsBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://instagram.com/arzansite_ai" },
  // { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/arzansite" },
  { icon: Github, label: "GitHub", href: "https://github.com/arzansite_ai" },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { unseenCount } = useNotifications();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setUserRole(user?.role || 'user');
  }, [user]);

  // Transparent on home top; glass when scrolled or on non-home routes
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${isHome && !scrolled ? 'bg-transparent border-transparent shadow-none' : 'bg-white/30 backdrop-blur-xl border-b border-white/20 shadow-lg'}`}
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
            className="w-12 h-12 flex items-center justify-center group-hover:scale-105 group-hover:rotate-6 transition-transform"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src="/logo.png" alt="Arzan Site Logo" className="w-10 h-10 object-contain rounded-xl" />
          </motion.div>
          <div className="flex flex-col rtl:text-right ltr:text-left">
            <motion.span
              className="lg:text-2xl sm:text-sm font-extrabold leading-tight bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-500 bg-clip-text text-transparent"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: "100% 50%" }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2,
                ease: "linear"
              }}
              style={{
                backgroundSize: "50% 50%",
                display: "inline-block"
              }}
            >
              ارزان سایت
            </motion.span>
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
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-white/90 text-primary border-primary/20 hover:bg-primary hover:text-white"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden md:inline">حساب کاربری</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      داشبورد
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="w-4 h-4 ml-2" />
                        پنل مدیریت
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/wizard")}>
                      شروع پروژه جدید
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 ml-2" />
                      خروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/auth")}
                    variant="outline"
                    className="bg-white/90 text-primary border-primary/20 hover:bg-primary hover:text-white"
                  >
                    ورود
                  </Button>
                  <Button
                    onClick={() => navigate("/wizard")}
                    className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors text-base"
                  >
                    شروع کنید
                  </Button>
                </>
              )}
            </>
          )}
          {user && <NotificationsBell />}
          <a href="tel:+9802191030981" className="hidden lg:inline-flex items-center gap-1 bg-white text-primary transition-colors text-sm px-2 rounded-lg font-semibold shadow-sm hover:bg-primary hover:text-white">
            <Phone className="w-4 h-4" /> ۰۲۱-۹۱۰۳-۰۹۸۱
          </a>
          <a href="mailto:info@arzansite.com" className="hidden lg:inline-flex items-center gap-1 bg-white text-primary transition-colors text-sm px-2 rounded-lg font-semibold shadow-sm hover:bg-primary hover:text-white">
            <Mail className="w-4 h-4" /> info@arzansite.com
          </a>
        </div>
        {/* Mobile menu/socials */}
        {/* <div className="hidden lg:inline-flex items-center gap-2">
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
        </div> */}
      </div>
    </motion.header>
  );
};

export default Header; 