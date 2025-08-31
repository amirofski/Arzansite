import { useState, useEffect, useCallback } from 'react';
import { SkeletonTemplate, getTemplatesByCategory, getAllTemplates } from './index';

interface UseTemplateLoaderReturn {
  templates: Record<string, SkeletonTemplate[]>;
  loading: boolean;
  error: string | null;
  loadTemplates: (category?: string) => Promise<void>;
  getTemplateById: (id: string) => SkeletonTemplate | null;
  getTemplatesByCategory: (category: string) => SkeletonTemplate[];
}

export const useTemplateLoader = (): UseTemplateLoaderReturn => {
  const [templates, setTemplates] = useState<Record<string, SkeletonTemplate[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (category) {
        // Load specific category
        const categoryTemplates = await getTemplatesByCategory(category);
        setTemplates(prev => ({
          ...prev,
          [category]: categoryTemplates
        }));
      } else {
        // Load all templates
        const allTemplates = await getAllTemplates();
        setTemplates(allTemplates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplateById = useCallback((id: string): SkeletonTemplate | null => {
    for (const categoryTemplates of Object.values(templates)) {
      const template = categoryTemplates.find(t => t.id === id);
      if (template) return template;
    }
    return null;
  }, [templates]);

  const getTemplatesByCategory = useCallback((category: string): SkeletonTemplate[] => {
    return templates[category] || [];
  }, [templates]);

  // Preload common categories on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    getTemplateById,
    getTemplatesByCategory
  };
};

// Cache for loaded templates to avoid re-loading
const templateCache = new Map<string, SkeletonTemplate[]>();

export const useTemplateCache = () => {
  const [cache, setCache] = useState<Map<string, SkeletonTemplate[]>>(templateCache);

  const getCachedTemplates = useCallback(async (category: string): Promise<SkeletonTemplate[]> => {
    if (cache.has(category)) {
      return cache.get(category)!;
    }

    const templates = await getTemplatesByCategory(category);
    cache.set(category, templates);
    setCache(new Map(cache));
    return templates;
  }, [cache]);

  const clearCache = useCallback(() => {
    cache.clear();
    setCache(new Map());
  }, [cache]);

  return {
    getCachedTemplates,
    clearCache,
    isCached: (category: string) => cache.has(category)
  };
}; 