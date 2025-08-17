import { useState, useEffect } from 'react';
import { apiClient, SiteConfig } from '@/lib/api-client';

export type SiteMode = 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';

export const useSiteMode = () => {
  const [mode, setMode] = useState<SiteMode>('normal');
  const [loading, setLoading] = useState(true);
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
      console.log('useSiteMode: Environment variables:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE
      });
      
      const data: SiteConfig = await apiClient.getSiteConfig();
      console.log('useSiteMode: Successfully fetched site config:', data);
      setMode(data.mode);
      setHasFetched(true);
    } catch (error) {
      console.error('useSiteMode: Error fetching site mode:', error);
      console.error('useSiteMode: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Check if it's an authentication error and handle it appropriately
      if (error instanceof Error) {
        const isAuthError = error.message.includes('Unauthorized') || 
                           error.message.includes('Authentication failed') ||
                           error.message.includes('please log in again');
        
        if (isAuthError) {
          console.log('useSiteMode: Authentication error detected, setting mode to normal');
          // For auth errors, we'll set normal mode and let the auth system handle the user state
        }
        
        setError(error.message);
      }
      
      // Always set a fallback mode to prevent the app from crashing
      setMode('normal');
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useSiteMode: useEffect triggered - fetching site mode...');
    fetchSiteMode();
  }, []);

  const updateSiteMode = async (newMode: SiteMode) => {
    try {
      setError(null);
      const updatedConfig: SiteConfig = await apiClient.updateSiteConfig(newMode);
      setMode(updatedConfig.mode);
      return true;
    } catch (error) {
      console.error('Error updating site mode:', error);
      setError(error instanceof Error ? error.message : 'Failed to update site mode');
      return false;
    }
  };

  return { mode, loading, error, updateSiteMode, refetch: fetchSiteMode };
};