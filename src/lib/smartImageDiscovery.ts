// Smart Image Discovery System
// This system efficiently discovers images without making unnecessary network requests

export interface SmartImageInfo {
  id: string;
  path: string;
  name: string;
  category: string;
  exists: boolean;
}

export interface DiscoveryResult {
  category: string;
  images: SmartImageInfo[];
  totalFound: number;
  discoveryTime: number;
}

// Known image ranges for each category (based on actual folder contents)
const KNOWN_IMAGE_RANGES: Record<string, number> = {
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

// Smart discovery that uses known ranges and minimal validation
export const discoverImagesEfficiently = async (category: string): Promise<SmartImageInfo[]> => {
  const startTime = Date.now();
  const images: SmartImageInfo[] = [];
  
  // Get the known range for this category
  const knownRange = KNOWN_IMAGE_RANGES[category] || 20;
  console.log(`🎯 Starting efficient discovery for ${category} (known range: ${knownRange})`);
  
  // Create image entries based on known range
  for (let i = 1; i <= knownRange; i++) {
    const imagePath = `/designs/${category}/${i}.png`;
    
    images.push({
      id: `${category}-${i}`,
      path: imagePath,
      name: `${category} ${i}`,
      category: category,
      exists: true // Assume exists based on known range
    });
  }
  
  // Only validate a few images to confirm the range is correct
  const validationCount = Math.min(5, Math.floor(knownRange / 4));
  const validationPromises: Promise<boolean>[] = [];
  
  // Validate random images to ensure range is accurate
  for (let i = 0; i < validationCount; i++) {
    const randomIndex = Math.floor(Math.random() * knownRange);
    const imagePath = images[randomIndex].path;
    
    const validationPromise = validateImageExists(imagePath);
    validationPromises.push(validationPromise);
  }
  
  try {
    const validationResults = await Promise.all(validationPromises);
    const validCount = validationResults.filter(exists => exists).length;
    
    if (validCount < validationCount * 0.8) {
      // If validation fails, fall back to conservative range
      console.log(`⚠️ Validation failed for ${category}, using conservative range`);
      const conservativeRange = Math.floor(knownRange * 0.8);
      return images.slice(0, conservativeRange);
    }
    
    const discoveryTime = Date.now() - startTime;
    console.log(`✅ Efficient discovery completed for ${category}: ${images.length} images in ${discoveryTime}ms`);
    
    return images;
  } catch (error) {
    console.error(`❌ Validation failed for ${category}:`, error);
    // Return conservative range on validation failure
    const conservativeRange = Math.floor(knownRange * 0.8);
    return images.slice(0, conservativeRange);
  }
};

// Quick image existence check
const validateImageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const response = await fetch(imagePath, { 
      method: 'HEAD',
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Get discovery statistics
export const getDiscoveryStats = () => {
  const totalImages = Object.values(KNOWN_IMAGE_RANGES).reduce((sum, count) => sum + count, 0);
  const totalCategories = Object.keys(KNOWN_IMAGE_RANGES).length;
  
  return {
    totalCategories,
    totalImages,
    averageImagesPerCategory: Math.round(totalImages / totalCategories),
    categories: Object.entries(KNOWN_IMAGE_RANGES).map(([category, count]) => ({
      category,
      count,
      path: `/designs/${category}/`
    }))
  };
};

// Get category info
export const getCategoryInfo = (category: string) => {
  const count = KNOWN_IMAGE_RANGES[category];
  if (!count) return null;
  
  return {
    category,
    imageCount: count,
    path: `/designs/${category}/`,
    estimatedSize: `${Math.round(count * 0.5)}MB` // Rough estimate
  };
};
