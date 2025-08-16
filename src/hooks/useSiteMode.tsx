import { useState, useEffect } from 'react';
import { apiClient, SiteConfig } from '@/lib/api-client';

export type SiteMode = 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';

export const useSiteMode = () => {
  const [mode, setMode] = useState<SiteMode>('normal');
  const [loading, setLoading] = useState(true);

  const fetchSiteMode = async () => {
    try {
      console.log('useSiteMode: Starting to fetch site mode...');
      console.log('useSiteMode: Environment variables:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE
      });
      
      const data: SiteConfig = await apiClient.getSiteConfig();
      console.log('useSiteMode: Successfully fetched site config:', data);
      setMode(data.mode);
    } catch (error) {
      console.error('useSiteMode: Error fetching site mode:', error);
      console.error('useSiteMode: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
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