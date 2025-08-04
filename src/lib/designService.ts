import { supabase } from '@/integrations/supabase/client';

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
  siteType: string;
  modules: any[];
  branding: any;
  userInfo: any;
  pricing: any;
}

export class DesignService {
  /**
   * Save design data to database
   */
  static async saveDesign(orderId: string, design: DynamicDesign, options?: DesignOptions): Promise<void> {
    try {
      // Save design data using the database function
      const { error } = await supabase.rpc('save_design_data', {
        p_order_id: orderId,
        p_design_data: design
      });

      if (error) throw error;

      // Update order with design options if provided
      if (options) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            design_options: options,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) throw updateError;
      }
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
      const { data, error } = await supabase.rpc('get_design_data', {
        p_order_id: orderId
      });

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('orders')
        .select('design_options')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data?.design_options || null;
    } catch (error) {
      console.error('Error loading design options:', error);
      return null;
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
      const { error } = await supabase
        .from('orders')
        .update({
          design_preview_url: previewUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('orders')
        .select('total_pages, total_sections, design_data, design_preview_url')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return {
        totalPages: data.total_pages || 0,
        totalSections: data.total_sections || 0,
        hasDesign: !!data.design_data,
        previewUrl: data.design_preview_url
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