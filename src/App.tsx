import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Wizard from "./pages/Wizard";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import PaymentCallback from "./pages/PaymentCallback";
import OAuthCallback from "./components/OAuthCallback";
import NotFound from "./pages/NotFound";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSiteMode } from "@/hooks/useSiteMode";
import SiteModeDisplay from "@/components/ui/SiteModeDisplay";
import React from "react";
import { AnimatedLoader } from "./components/ui/AnimatedLoader";

const queryClient = new QueryClient();

// Wrapper component that ensures auth context is available
const SiteModeWrapper = React.memo(() => {
  const { mode, loading, error } = useSiteMode();
  const navigate = useNavigate();

  // Expose a minimal global navigate helper for non-routed modules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__APP_NAVIGATE__ = (path: string) => navigate(path);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedLoader size="lg" variant="gradient2"/>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    console.warn('Site mode error:', error);
    // Continue with normal mode even if there's an error
  }

  // Show full-page mode displays for maintenance and unavailable modes
  if (mode === 'temporarily_unavailable' || mode === 'update_mode') {
    return <SiteModeDisplay mode={mode} />;
  }

  return (
    <>
      {mode === 'development_mode' && (
        <div className="relative z-50 mt-20">
          <SiteModeDisplay mode={mode} />
        </div>
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/oauth/callback" element={<OAuthCallback provider="github" />} />
        <Route path="/auth/oauth/callback/:provider" element={<OAuthCallback />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        {/* <Route path="/payment-callback" element={<PaymentCallback />} /> */}
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/contact" element={<Contact />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SiteModeWrapper />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
