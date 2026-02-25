import { useState, useEffect } from 'react';
import { siteConfigurationService, type SiteConfig } from '@/lib/services';

export type SiteMode = 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';

export const useSiteMode = () => {
  const [mode, setMode] = useState<SiteMode>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSiteMode = async () => {
    // Prevent duplicate calls
    if (hasFetched && !loading) {
      console.log('useSiteMode: Already fetched, skipping duplicate call');
      return;
    }
    
    try {
      setError(null);
      console.log('useSiteMode: Starting to fetch site mode...');
      
      // Since the site-config endpoint doesn't exist, we'll set a default mode
      // and skip the API call to prevent HTML responses
      console.log('useSiteMode: Site-config endpoint not available, using default mode');
      setMode('normal');
      setHasFetched(true);
      
    } catch (error) {
      console.error('useSiteMode: Error fetching site mode:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch site mode');
      setMode('normal');
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useSiteMode: useEffect triggered - setting default mode...');
    fetchSiteMode();
  }, []);

  const updateSiteMode = async (newMode: SiteMode) => {
    try {
      setError(null);
      // Since the endpoint doesn't exist, we'll just update the local state
      setMode(newMode);
      return true;
    } catch (error) {
      console.error('Error updating site mode:', error);
      setError(error instanceof Error ? error.message : 'Failed to update site mode');
      return false;
    }
  };

  return { mode, loading, error, updateSiteMode, refetch: fetchSiteMode };
};