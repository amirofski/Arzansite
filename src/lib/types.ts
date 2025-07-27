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

export interface WireframeElement {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  [key: string]: unknown;
}

export interface WireframePage {
  name: string;
  elements: WireframeElement[];
}

export interface WireframeData {
  pages?: WireframePage[];
}

export interface Wireframe {
  id: string;
  name: string;
  description?: string;
  data: WireframeData;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata?: {
    size: number;
  };
} 