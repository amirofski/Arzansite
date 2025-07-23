import React from 'react';
import { AlertTriangle, Settings, Code } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SiteModeDisplayProps {
  mode: string;
}

const SiteModeDisplay: React.FC<SiteModeDisplayProps> = ({ mode }) => {
  if (mode === 'normal') return null;

  const getModeConfig = (mode: string) => {
    switch (mode) {
      case 'temporarily_unavailable':
        return {
          title: 'سایت موقتاً در دسترس نیست',
          description: 'متأسفانه سایت در حال حاضر در دسترس نمی‌باشد. لطفاً بعداً تلاش کنید.',
          icon: AlertTriangle,
          className: 'border-red-200 bg-red-50 text-red-800',
          fullPage: true
        };
      case 'update_mode':
        return {
          title: 'سایت در حال بروزرسانی',
          description: 'سایت در حال بروزرسانی می‌باشد. ممکن است برخی از امکانات دچار اختلال شوند.',
          icon: Settings,
          className: 'border-orange-200 bg-orange-50 text-orange-800',
          fullPage: true
        };
      case 'development_mode':
        return {
          title: 'نسخه توسعه',
          description: 'این سایت در حالت توسعه قرار دارد.',
          icon: Code,
          className: 'border-blue-200 bg-blue-50 text-blue-800',
          fullPage: false
        };
      default:
        return null;
    }
  };

  const config = getModeConfig(mode);
  if (!config) return null;

  const { title, description, icon: Icon, className, fullPage } = config;

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <strong>{title}:</strong> {description}
      </AlertDescription>
    </Alert>
  );
};

export default SiteModeDisplay;