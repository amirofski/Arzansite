import { apiClient, DesignData, DesignOptions } from '@/lib/api-client';

export interface PageSection {
  id: string;
  sectionType: string;
  layoutId: string;
  order: number;
  customData?: {
    title?: string;
    content?: string;
    images?: string[];
  };
}

export interface PageDesign {
  id: string;
  name: string;
  sections: PageSection[];
  canvasDimensions: {
    width: number;
    height: number;
  };
}

export interface DynamicDesign {
  pages: PageDesign[];
  currentPageId: string;
}

export class DesignService {
  /**
   * Save design data to database
   */
  static async saveDesign(orderId: string, design: DynamicDesign, options?: DesignOptions): Promise<void> {
    try {
      // Convert DynamicDesign to DesignData format
      const designData: DesignData = {
        pages: design.pages,
        currentPageId: design.currentPageId,
      };

      await apiClient.saveDesign(orderId, designData, options);
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }

  /**
   * Load design data from database
   */
  static async loadDesign(orderId: string): Promise<DynamicDesign | null> {
    try {
      const response = await apiClient.getDesign(orderId);
      if (!response?.design) return null;

      // Convert DesignData back to DynamicDesign format
      const designData = response.design;
      return {
        pages: designData.pages || [],
        currentPageId: designData.currentPageId || '',
      };
    } catch (error) {
      console.error('Error loading design:', error);
      return null;
    }
  }

  /**
   * Get design options for an order
   */
  static async getDesignOptions(orderId: string): Promise<DesignOptions | null> {
    try {
      return await apiClient.getDesignOptions(orderId);
    } catch (error) {
      console.error('Error loading design options:', error);
      return null;
    }
  }

  /**
   * Update design options
   */
  static async updateDesignOptions(orderId: string, options: DesignOptions): Promise<void> {
    try {
      await apiClient.updateDesignOptions(orderId, options);
    } catch (error) {
      console.error('Error updating design options:', error);
      throw error;
    }
  }

  /**
   * Generate design preview URL (placeholder for now)
   */
  static async generatePreviewUrl(orderId: string, design: DynamicDesign): Promise<string> {
    // This would typically involve rendering the design to an image
    // For now, we'll return a placeholder URL
    return `/api/design-preview/${orderId}`;
  }

  /**
   * Update design preview URL
   */
  static async updatePreviewUrl(orderId: string, previewUrl: string): Promise<void> {
    try {
      await apiClient.updatePreviewUrl(orderId, previewUrl);
    } catch (error) {
      console.error('Error updating preview URL:', error);
      throw error;
    }
  }

  /**
   * Get order design summary
   */
  static async getOrderDesignSummary(orderId: string): Promise<{
    totalPages: number;
    totalSections: number;
    hasDesign: boolean;
    previewUrl: string | null;
  } | null> {
    try {
      const design = await this.loadDesign(orderId);
      if (!design) {
        return {
          totalPages: 0,
          totalSections: 0,
          hasDesign: false,
          previewUrl: null,
        };
      }

      const totalPages = design.pages.length;
      const totalSections = design.pages.reduce((total, page) => total + page.sections.length, 0);

      return {
        totalPages,
        totalSections,
        hasDesign: true,
        previewUrl: null, // Would need to be fetched separately
      };
    } catch (error) {
      console.error('Error getting design summary:', error);
      return null;
    }
  }

  /**
   * Calculate design statistics
   */
  static calculateDesignStats(design: DynamicDesign): {
    totalPages: number;
    totalSections: number;
    sectionsByType: Record<string, number>;
  } {
    const totalPages = design.pages.length;
    const totalSections = design.pages.reduce((total, page) => total + page.sections.length, 0);
    
    const sectionsByType: Record<string, number> = {};
    design.pages.forEach(page => {
      page.sections.forEach(section => {
        sectionsByType[section.sectionType] = (sectionsByType[section.sectionType] || 0) + 1;
      });
    });

    return {
      totalPages,
      totalSections,
      sectionsByType
    };
  }

  /**
   * Validate design data
   */
  static validateDesign(design: DynamicDesign): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!design.pages || design.pages.length === 0) {
      errors.push('Design must have at least one page');
    }

    if (!design.currentPageId) {
      errors.push('Design must have a current page ID');
    }

    design.pages.forEach((page, pageIndex) => {
      if (!page.id) {
        errors.push(`Page ${pageIndex + 1} must have an ID`);
      }
      if (!page.name) {
        errors.push(`Page ${pageIndex + 1} must have a name`);
      }
      if (!page.sections) {
        errors.push(`Page ${pageIndex + 1} must have sections array`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 