// Dynamic Image Loader for Section Designs
// This utility automatically discovers and loads section images

import { discoverAllImages, discoverCategoryImages, DiscoveredImage, DiscoveredCategory } from './imageDiscovery';

export interface SectionImage {
  id: string;
  path: string;
  name: string;
  category: string;
}

export interface SectionCategory {
  id: string;
  name: string;
  images: SectionImage[];
}

// Map folder names to Persian section names
export const SECTION_NAMES: Record<string, string> = {
  'headers': 'هدر',
  'hero': 'بخش اصلی',
  'about': 'درباره',
  'services': 'خدمات',
  'contact': 'تماس',
  'newsletter': 'خبرنامه',
  'footer': 'فوتر',
  'features': 'ویژگی‌ها',
  'gallery': 'گالری',
  'testimonials': 'نظرات',
  'team': 'تیم',
  'pricing': 'قیمت‌گذاری',
  'faqs': 'سوالات متداول',
  'blog_posts': 'مقالات',
  'call_to_actions': 'فراخوان عمل',
  'content': 'محتوا',
  'forms': 'فرم‌ها',
  'accordion': 'آکاردئون',
  'tables': 'جداول',
  'stats': 'آمار',
  'socials': 'شبکه‌های اجتماعی',
  'logos': 'لوگوها',
  'left_right_sections': 'بخش‌های چپ و راست',
  'full_page': 'صفحه کامل'
};

// Cache for discovered images
let discoveredCategoriesCache: DiscoveredCategory[] | null = null;
let lastDiscoveryTime: number = 0;
const DISCOVERY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get all available section categories with automatic discovery
export const getSectionCategories = async (): Promise<SectionCategory[]> => {
  // Check cache first
  const now = Date.now();
  if (discoveredCategoriesCache && (now - lastDiscoveryTime) < CACHE_DURATION) {
    return discoveredCategoriesCache.map(cat => ({
      id: cat.id,
      name: cat.name,
      images: cat.images.map(img => ({
        id: img.id,
        path: img.path,
        name: img.name,
        category: img.category
      }))
    }));
  }

  try {
    // Discover images automatically
    const discoveredCategories = await discoverAllImages();
    discoveredCategoriesCache = discoveredCategories;
    lastDiscoveryTime = now;

    return discoveredCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      images: cat.images.map(img => ({
        id: img.id,
        path: img.path,
        name: img.name,
        category: img.category
      }))
    }));
  } catch (error) {
    console.error('Failed to discover images:', error);
    
    // Fallback to hardcoded categories
    const fallbackCategories: SectionCategory[] = [];
    const folderNames = Object.keys(SECTION_NAMES);
    
    folderNames.forEach(folderName => {
      fallbackCategories.push({
        id: folderName,
        name: SECTION_NAMES[folderName],
        images: getSectionImagesFallback(folderName)
      });
    });
    
    return fallbackCategories;
  }
};



// Fallback function for when discovery fails
const getSectionImagesFallback = (category: string): SectionImage[] => {
  const images: SectionImage[] = [];
  
  // Use estimated ranges based on your folder structure
  const imageRanges: Record<string, number> = {
    'headers': 37,
    'hero': 42,
    'about': 25,
    'services': 30,
    'contact': 20,
    'newsletter': 15,
    'footer': 25,
    'features': 35,
    'gallery': 20,
    'testimonials': 15,
    'team': 20,
    'pricing': 25,
    'faqs': 15,
    'blog_posts': 20,
    'call_to_actions': 20,
    'content': 30,
    'forms': 15,
    'accordion': 15,
    'tables': 10,
    'stats': 15,
    'socials': 10,
    'logos': 20,
    'left_right_sections': 15,
    'full_page': 10
  };
  
  const maxImages = imageRanges[category] || 20;
  
  for (let i = 1; i <= maxImages; i++) {
    const imagePath = `/designs/${category}/${i}.png`;
    
    images.push({
      id: `${category}-${i}`,
      path: imagePath,
      name: `${SECTION_NAMES[category]} ${i}`,
      category: category
    });
  }
  
  return images;
};

// Function to get a specific image by ID
export const getSectionImageById = async (id: string): Promise<SectionImage | null> => {
  const [category, number] = id.split('-');
  if (!category || !number) return null;
  
  const images = await getSectionImages(category);
  return images.find(img => img.id === id) || null;
};

// Function to get images by category
export const getImagesByCategory = async (category: string): Promise<SectionImage[]> => {
  return await getSectionImages(category);
};

// Function to get the next/previous image in a category
export const getAdjacentImage = async (currentId: string, direction: 'next' | 'prev'): Promise<SectionImage | null> => {
  const [category, number] = currentId.split('-');
  if (!category || !number) return null;
  
  const images = await getSectionImages(category);
  const currentIndex = images.findIndex(img => img.id === currentId);
  
  if (currentIndex === -1 || images.length === 0) return null;
  
  if (direction === 'next') {
    const nextIndex = (currentIndex + 1) % images.length;
    return images[nextIndex];
  } else {
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    return images[prevIndex];
  }
};

// Browser cache management
const CACHE_PREFIX = 'section_images_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Function to get cached images for a category
const getCachedImages = (category: string): SectionImage[] | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${category}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { images, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return images;
  } catch {
    return null;
  }
};

// Function to cache images for a category
const cacheImages = (category: string, images: SectionImage[]): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${category}`;
    const cacheData = {
      images,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache images:', error);
  }
};

// Function to validate if an image exists (only when needed)
export const validateImageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Function to get images for a specific category with lazy loading and caching
export const getSectionImages = async (category: string): Promise<SectionImage[]> => {
  // Check browser cache first
  const cachedImages = getCachedImages(category);
  if (cachedImages) {
    console.log(`📦 Using cached images for ${category}: ${cachedImages.length} images`);
    return cachedImages;
  }

  try {
    // Try to discover images automatically
    const discoveredCategory = await discoverCategoryImages(category);
    const images = discoveredCategory.images.map(img => ({
      id: img.id,
      path: img.path,
      name: img.name,
      category: img.category
    }));
    
    // Cache the discovered images
    cacheImages(category, images);
    console.log(`🔍 Discovered and cached ${images.length} images for ${category}`);
    
    return images;
  } catch (error) {
    console.error(`Failed to discover images for ${category}:`, error);
    
    // Fallback to hardcoded ranges
    const fallbackImages = getSectionImagesFallback(category);
    
    // Cache the fallback images
    cacheImages(category, fallbackImages);
    console.log(`📋 Using fallback images for ${category}: ${fallbackImages.length} images`);
    
    return fallbackImages;
  }
};

// Function to preload and cache images for a category (called when user selects a section)
export const preloadCategoryImages = async (category: string): Promise<SectionImage[]> => {
  console.log(`🚀 Preloading images for ${category}...`);
  
  // Check if already cached
  const cachedImages = getCachedImages(category);
  if (cachedImages) {
    console.log(`✅ ${category} images already cached`);
    return cachedImages;
  }
  
  // Load and cache images
  const images = await getSectionImages(category);
  
  // Preload actual image files to browser cache
  const preloadPromises = images.slice(0, 10).map(image => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't fail on individual image errors
      img.src = image.path;
    });
  });
  
  // Wait for preloading to complete (but don't block UI)
  Promise.all(preloadPromises).then(() => {
    console.log(`🎯 Preloaded ${preloadPromises.length} images for ${category}`);
  });
  
  return images;
};

// Function to clear cache for a specific category
export const clearCategoryCache = (category: string): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${category}`;
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ Cleared cache for ${category}`);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

// Function to clear all image caches
export const clearAllImageCaches = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cleared all image caches');
  } catch (error) {
    console.warn('Failed to clear caches:', error);
  }
};

// Function to get cache status for all categories
export const getImageCacheStatus = () => {
  try {
    const keys = Object.keys(localStorage);
    const imageKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    const cacheInfo: Record<string, unknown> = {};
    
    imageKeys.forEach(key => {
      const category = key.replace(CACHE_PREFIX, '');
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { images, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          cacheInfo[category] = {
            cached: true,
            imageCount: images.length,
            age: age,
            ageFormatted: `${Math.round(age / 1000)}s ago`
          };
        }
      } catch {
        // Ignore corrupted cache entries
      }
    });
    
    return cacheInfo;
  } catch {
    return {};
  }
};

// Function to refresh the image cache
export const refreshImageCache = async (): Promise<void> => {
  discoveredCategoriesCache = null;
  lastDiscoveryTime = 0;
  await getSectionCategories(); // This will rebuild the cache
};

// Function to get discovery cache status
export const getDiscoveryCacheStatus = () => {
  if (!discoveredCategoriesCache) {
    return { cached: false, age: null };
  }
  
  const age = Date.now() - lastDiscoveryTime;
  return { 
    cached: true, 
    age: age,
    ageFormatted: `${Math.round(age / 1000)}s ago`
  };
};
