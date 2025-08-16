// Automatic Image Discovery Utility
// This utility scans the designs folder and automatically discovers available section images

export interface DiscoveredImage {
  id: string;
  path: string;
  name: string;
  category: string;
  exists: boolean;
  size?: number;
}

export interface DiscoveredCategory {
  id: string;
  name: string;
  images: DiscoveredImage[];
  totalImages: number;
  validImages: number;
}

// Function to discover all available images in the designs folder
export const discoverAllImages = async (): Promise<DiscoveredCategory[]> => {
  const categories = [
    'headers', 'hero', 'about', 'services', 'contact', 'newsletter', 'footer',
    'features', 'gallery', 'testimonials', 'team', 'pricing', 'faqs', 
    'blog_posts', 'call_to_actions', 'content', 'forms', 'accordion', 
    'tables', 'stats', 'socials', 'logos', 'left_right_sections', 'full_page'
  ];

  const discoveredCategories: DiscoveredCategory[] = [];

  for (const category of categories) {
    const categoryImages = await discoverCategoryImages(category);
    discoveredCategories.push(categoryImages);
  }

  return discoveredCategories;
};

// Function to discover images for a specific category
export const discoverCategoryImages = async (category: string): Promise<DiscoveredCategory> => {
  const images: DiscoveredImage[] = [];
  let totalImages = 0;
  let validImages = 0;

  // Try to find images with numbers 1-100
  for (let i = 1; i <= 100; i++) {
    const imagePath = `/designs/${category}/${i}.png`;
    const exists = await validateImageExists(imagePath);
    
    if (exists) {
      const image: DiscoveredImage = {
        id: `${category}-${i}`,
        path: imagePath,
        name: `${getCategoryDisplayName(category)} ${i}`,
        category: category,
        exists: true
      };
      
      images.push(image);
      validImages++;
    }
    
    totalImages++;
    
    // Stop if we haven't found any images in the last 10 attempts
    if (i > 20 && validImages === 0) {
      break;
    }
  }

  return {
    id: category,
    name: getCategoryDisplayName(category),
    images,
    totalImages,
    validImages
  };
};

// Function to validate if an image exists
export const validateImageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Function to get display name for category
export const getCategoryDisplayName = (category: string): string => {
  const displayNames: Record<string, string> = {
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

  return displayNames[category] || category;
};

// Function to get next/previous image in a category
export const getAdjacentImageInCategory = (
  currentId: string, 
  direction: 'next' | 'prev',
  categoryImages: DiscoveredImage[]
): DiscoveredImage | null => {
  const currentIndex = categoryImages.findIndex(img => img.id === currentId);
  
  if (currentIndex === -1 || categoryImages.length === 0) return null;
  
  if (direction === 'next') {
    const nextIndex = (currentIndex + 1) % categoryImages.length;
    return categoryImages[nextIndex];
  } else {
    const prevIndex = currentIndex === 0 ? categoryImages.length - 1 : currentIndex - 1;
    return categoryImages[prevIndex];
  }
};

// Function to get random image from a category
export const getRandomImageFromCategory = (categoryImages: DiscoveredImage[]): DiscoveredImage | null => {
  if (categoryImages.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * categoryImages.length);
  return categoryImages[randomIndex];
};

// Function to get images by tags or search
export const searchImages = (
  categories: DiscoveredCategory[],
  query: string
): DiscoveredImage[] => {
  const searchTerm = query.toLowerCase();
  const results: DiscoveredImage[] = [];

  for (const category of categories) {
    for (const image of category.images) {
      if (
        image.name.toLowerCase().includes(searchTerm) ||
        image.category.toLowerCase().includes(searchTerm) ||
        image.id.toLowerCase().includes(searchTerm)
      ) {
        results.push(image);
      }
    }
  }

  return results;
};

// Function to get category statistics
export const getCategoryStats = (categories: DiscoveredCategory[]) => {
  const stats = {
    totalCategories: categories.length,
    totalImages: 0,
    validImages: 0,
    categoriesWithImages: 0,
    averageImagesPerCategory: 0
  };

  for (const category of categories) {
    stats.totalImages += category.totalImages;
    stats.validImages += category.validImages;
    if (category.validImages > 0) {
      stats.categoriesWithImages++;
    }
  }

  stats.averageImagesPerCategory = stats.validImages / stats.categoriesWithImages || 0;

  return stats;
};

// Function to export discovery results
export const exportDiscoveryResults = (categories: DiscoveredCategory[]) => {
  const results = {
    timestamp: new Date().toISOString(),
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      imageCount: cat.validImages,
      images: cat.images.map(img => ({
        id: img.id,
        path: img.path,
        name: img.name
      }))
    })),
    stats: getCategoryStats(categories)
  };

  return JSON.stringify(results, null, 2);
};
