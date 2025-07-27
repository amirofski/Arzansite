// Template Categories
export { default as headerTemplates } from './header';
export { default as heroTemplates } from './hero';
export { default as aboutTemplates } from './about';
export { default as servicesTemplates } from './services';
export { default as contactTemplates } from './contact';
export { default as newsletterTemplates } from './newsletter';
export { default as footerTemplates } from './footer';

// Template Loader Hook
export { useTemplateLoader, useTemplateCache } from './useTemplateLoader';

// Template Types
export interface SkeletonTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  component: React.ComponentType<{ className?: string }>;
  preview?: string;
  tags?: string[];
}

// Template Categories Interface
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: SkeletonTemplate[];
}

// All templates grouped by category
export const allTemplates = {
  header: () => import('./header'),
  hero: () => import('./hero'),
  about: () => import('./about'),
  services: () => import('./services'),
  contact: () => import('./contact'),
  newsletter: () => import('./newsletter'),
  footer: () => import('./footer'),
};

// Helper function to get templates by category
export const getTemplatesByCategory = async (category: string): Promise<SkeletonTemplate[]> => {
  try {
    const module = await allTemplates[category as keyof typeof allTemplates]();
    return module.default.templates;
  } catch (error) {
    console.error(`Failed to load templates for category: ${category}`, error);
    return [];
  }
};

// Helper function to get all templates
export const getAllTemplates = async (): Promise<Record<string, SkeletonTemplate[]>> => {
  const categories = Object.keys(allTemplates);
  const templates: Record<string, SkeletonTemplate[]> = {};
  
  for (const category of categories) {
    templates[category] = await getTemplatesByCategory(category);
  }
  
  return templates;
}; 