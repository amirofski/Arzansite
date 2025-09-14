import { ordersService } from '@/lib/services';

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

export interface DesignOptions {
  theme?: string;
  font?: string;
  spacing?: string;
  customCss?: string;
}

export class DesignService {
  /**
   * Save design data to database
   */
  static async saveDesign(orderId: string, design: DynamicDesign, options?: DesignOptions): Promise<void> {
    try {
      await ordersService.saveDesign(orderId, design as unknown as Record<string, unknown>, options as unknown as Record<string, unknown>);
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
      // Primary: explicit design API
      const response = await ordersService.getDesign(orderId);
      if (response?.design) {
        const design = response.design as Record<string, unknown>;
        return {
          pages: (design.pages as PageDesign[]) || [],
          currentPageId: (design.currentPageId as string) || '',
        };
      }
    } catch (error) {
      // continue to fallback
      console.warn('DesignService.loadDesign: primary design endpoint failed, trying fallback');
    }

    // Fallback: derive from order details (wizard_data or description)
    try {
      const detail = await ordersService.getOrder(orderId);
      const order = (detail as any)?.order || detail;
      if (!order) return null;

      // Try wizard_data first
      let wizard: any = (order as any).wizardData || (order as any).wizard_data || null;
      // Some backends store JSON string
      if (typeof wizard === 'string') {
        try { wizard = JSON.parse(wizard); } catch { wizard = null; }
      }

      // If no wizard_data, try parsing description
      if (!wizard && typeof order.description === 'string') {
        try {
          const parsed = JSON.parse(order.description);
          wizard = parsed && typeof parsed === 'object' ? parsed : null;
        } catch {}
      }

      if (!wizard || typeof wizard !== 'object') return null;

      // If dynamicDesign is present, use it directly
      const dynamic = wizard?.websiteFramework?.dynamicDesign;
      if (dynamic && typeof dynamic === 'object' && Array.isArray(dynamic.pages)) {
        return {
          pages: dynamic.pages as PageDesign[],
          currentPageId: dynamic.currentPageId || (dynamic.pages[0]?.id ?? 'main'),
        };
      }

      // Otherwise, reconstruct from legacy websiteFramework selectedLayouts
      const wf = wizard.websiteFramework || wizard.website_framework || {};
      const selectedLayouts = wf.selectedLayouts || wf.selected_layouts || {};
      const canvas = wf.canvasDimensions || wf.canvas_dimensions || { width: 1200, height: 800 };
      const pageStructure = wf.pageStructure || wf.page_structure || 'single';
      const customPages: string[] = wf.customPages || wf.custom_pages || ['صفحه اصلی'];

      const pages: PageDesign[] = [];
      if (pageStructure === 'single') {
        const sections = Object.entries(selectedLayouts).map(([sectionType, layoutId], index) => ({
          id: `${sectionType}-${index}`,
          sectionType: String(sectionType),
          layoutId: String(layoutId),
          order: index,
          customData: {},
        }));
        pages.push({ id: 'main', name: 'صفحه اصلی', sections, canvasDimensions: canvas });
      } else {
        customPages.forEach((pageName, pageIndex) => {
          const sections = Object.entries(selectedLayouts).map(([sectionType, layoutId], index) => ({
            id: `${sectionType}-${pageIndex}-${index}`,
            sectionType: String(sectionType),
            layoutId: String(layoutId),
            order: index,
            customData: {},
          }));
          pages.push({ id: `page-${pageIndex}`, name: pageName, sections, canvasDimensions: canvas });
        });
      }

      if (pages.length === 0) return null;
      return {
        pages,
        currentPageId: pages[0].id,
      };
    } catch (error) {
      console.error('Error loading design (fallback):', error);
      return null;
    }
  }

  /**
   * Get design options for an order
   */
  static async getDesignOptions(orderId: string): Promise<DesignOptions | null> {
    try {
      return await ordersService.getDesignOptions(orderId);
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
      await ordersService.updateDesignOptions(orderId, options as Record<string, unknown>);
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
      await ordersService.updatePreviewUrl(orderId, previewUrl);
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