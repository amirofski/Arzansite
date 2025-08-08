import { useState, useEffect } from 'react';
import { apiClient, SiteConfig } from '@/lib/api-client';

export type SiteMode = 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';

export const useSiteMode = () => {
  const [mode, setMode] = useState<SiteMode>('normal');
  const [loading, setLoading] = useState(true);

  const fetchSiteMode = async () => {
    try {
      const data: SiteConfig = await apiClient.getSiteConfig();
      setMode(data.mode);
    } catch (error) {
      console.error('Error fetching site mode:', error);
      setMode('normal'); // fallback to normal mode
    } finally {
      setLoading(false);
    }
  };

  const updateSiteMode = async (newMode: SiteMode) => {
    try {
      const updatedConfig: SiteConfig = await apiClient.updateSiteConfig(newMode);
      setMode(updatedConfig.mode);
      return true;
    } catch (error) {
      console.error('Error updating site mode:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSiteMode();
  }, []);

  return { mode, loading, updateSiteMode, refetch: fetchSiteMode };
};