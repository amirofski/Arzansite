import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Wizard from "./pages/Wizard";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import VerifyEmail from "./pages/VerifyEmail";
import PaymentCallback from "./pages/PaymentCallback";
import NotFound from "./pages/NotFound";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSiteMode } from "@/hooks/useSiteMode";
import SiteModeDisplay from "@/components/ui/SiteModeDisplay";

const queryClient = new QueryClient();

const AppContent = () => {
  const { mode, loading } = useSiteMode();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
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
        <Route path="/payment-callback" element={<PaymentCallback />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
