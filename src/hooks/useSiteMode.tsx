import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SiteMode = 'normal' | 'temporarily_unavailable' | 'update_mode' | 'development_mode';

export const useSiteMode = () => {
  const [mode, setMode] = useState<SiteMode>('normal');
  const [loading, setLoading] = useState(true);

  const fetchSiteMode = async () => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('mode')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching site mode:', error);
        setMode('normal'); // fallback to normal mode
      } else {
        setMode((data?.mode as SiteMode) || 'normal');
      }
    } catch (error) {
      console.error('Error fetching site mode:', error);
      setMode('normal'); // fallback to normal mode
    } finally {
      setLoading(false);
    }
  };

  const updateSiteMode = async (newMode: SiteMode) => {
    try {
      // Get the current config id
      const { data: currentConfig, error: fetchError } = await supabase
        .from('site_config')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      // Update the mode
      const { error } = await supabase
        .from('site_config')
        .update({ mode: newMode })
        .eq('id', currentConfig.id);

      if (error) throw error;

      setMode(newMode as SiteMode);
      return true;
    } catch (error) {
      console.error('Error updating site mode:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSiteMode();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('site-config-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_config'
        },
        (payload) => {
          setMode(payload.new.mode as SiteMode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { mode, loading, updateSiteMode, refetch: fetchSiteMode };
};