# Dynamic Design Canvas System

## Overview

The Dynamic Design Canvas System is a modern, modular approach to website design that allows users to create custom layouts by adding, removing, and reordering sections on a blank canvas. This system replaces the old hardcoded template selection with a flexible, drag-and-drop style interface.

## Key Features

### 🎨 **Dynamic Canvas**
- **Blank Canvas**: Start with an empty canvas and build your design from scratch
- **Add/Remove Sections**: Add any section type (header, hero, about, services, etc.) to your canvas
- **Reorder Sections**: Move sections up/down to change the layout order
- **Multi-page Support**: Create multiple pages with different layouts
- **Auto-calculated Height**: Page height automatically adjusts based on content

### 📱 **Responsive Design**
- **Canvas Dimensions**: Set custom width and height for each page
- **Device Presets**: Quick presets for desktop, tablet, and mobile
- **Responsive Preview**: See how your design looks on different screen sizes

### 🧩 **Modular Templates**
- **61+ Templates**: 61 skeleton templates across 7 categories
- **Lazy Loading**: Templates load only when needed for better performance
- **Easy Expansion**: Add new templates by creating new components

## Architecture

### File Structure
```
src/components/wizard/
├── DynamicDesignCanvas.tsx    # Main canvas component
├── DesignPreview.tsx          # Preview component for admin/user dashboards
├── templates/
│   ├── index.ts              # Central template management
│   ├── useTemplateLoader.ts  # Custom hook for lazy loading
│   ├── header.tsx            # Header templates (10 designs)
│   ├── hero.tsx              # Hero templates (10 designs)
│   ├── about.tsx             # About templates (8 designs)
│   ├── services.tsx          # Services templates (8 designs)
│   ├── contact.tsx           # Contact templates (8 designs)
│   ├── newsletter.tsx        # Newsletter templates (8 designs)
│   └── footer.tsx            # Footer templates (9 designs)
```

### Data Structure

#### PageSection Interface
```typescript
interface PageSection {
  id: string;
  sectionType: string;        // 'header', 'hero', 'about', etc.
  layoutId: string;           // Template ID like 'header-1', 'hero-2'
  order: number;              // Position in the page
  customData?: {              // Future: custom content
    title?: string;
    content?: string;
    images?: string[];
  };
}
```

#### PageDesign Interface
```typescript
interface PageDesign {
  id: string;
  name: string;               // Page name like 'صفحه اصلی'
  sections: PageSection[];    // Array of sections
  canvasDimensions: {
    width: number;
    height: number;
  };
}
```

## Usage

### In StepTwo.tsx (Wizard)
```typescript
import DynamicDesignCanvas from './DynamicDesignCanvas';

const StepTwo = ({ data, updateData }) => {
  const [dynamicDesign, setDynamicDesign] = useState({
    pages: [{
      id: 'main',
      name: 'صفحه اصلی',
      sections: [],
      canvasDimensions: { width: 1200, height: 800 }
    }],
    currentPageId: 'main'
  });

  const handleDesignChange = (newDesign) => {
    setDynamicDesign(newDesign);
    updateData({
      websiteFramework: {
        ...data.websiteFramework,
        dynamicDesign: newDesign
      }
    });
  };

  return (
    <DynamicDesignCanvas
      initialDesign={dynamicDesign}
      onDesignChange={handleDesignChange}
      isPreview={false}
    />
  );
};
```

### In Admin Dashboard
```typescript
import DesignPreview from '../wizard/DesignPreview';

const AdminDashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <DesignPreview
      design={selectedOrder.dynamicDesign}
      showActions={true}
      onDownload={() => handleDownload(selectedOrder.id)}
      onShare={() => handleShare(selectedOrder.id)}
      onViewLive={() => handleViewLive(selectedOrder.id)}
    />
  );
};
```

### In User Dashboard
```typescript
import DesignPreview from '../wizard/DesignPreview';

const UserDashboard = () => {
  const [userDesigns, setUserDesigns] = useState([]);

  return (
    <div>
      {userDesigns.map(design => (
        <DesignPreview
          key={design.id}
          design={design.dynamicDesign}
          showActions={false}
        />
      ))}
    </div>
  );
};
```

## Template System

### Adding New Templates

1. **Create Template Component**:
```typescript
// src/components/wizard/templates/header.tsx
const HeaderModern = ({ className }: { className?: string }) => (
  <div className={`h-20 bg-gradient-to-r from-blue-600 to-purple-600 ${className}`}>
    <div className="flex items-center justify-between px-6 h-full">
      <div className="w-24 h-8 bg-white/20 rounded"></div>
      <div className="flex gap-6">
        <div className="w-16 h-6 bg-white/20 rounded"></div>
        <div className="w-16 h-6 bg-white/20 rounded"></div>
        <div className="w-20 h-8 bg-white rounded"></div>
      </div>
    </div>
  </div>
);
```

2. **Add to Template Array**:
```typescript
export const headerTemplates: SkeletonTemplate[] = [
  {
    id: 'header-modern',
    name: 'هدر مدرن',
    description: 'هدر با گرادیان و طراحی مدرن',
    category: 'header',
    component: HeaderModern,
    tags: ['modern', 'gradient', 'professional']
  },
  // ... other templates
];
```

3. **Export from index.ts**:
```typescript
// src/components/wizard/templates/index.ts
export { default as headerTemplates } from './header';
```

### Template Categories

| Category | Templates | Description |
|----------|-----------|-------------|
| Header | 10 | Navigation and logo sections |
| Hero | 10 | Main introduction sections |
| About | 8 | Company/about sections |
| Services | 8 | Services and products |
| Contact | 8 | Contact information |
| Newsletter | 8 | Email subscription |
| Footer | 9 | Footer information |

## Performance Features

### 🚀 **Lazy Loading**
- Templates are loaded only when needed
- Reduces initial bundle size
- Improves page load performance

### 💾 **Caching**
- `useTemplateCache` hook prevents re-loading
- Templates are cached after first load
- Automatic cache management

### 📦 **Code Splitting**
- Each template category is in its own bundle
- Dynamic imports for better performance
- Automatic tree shaking

## Migration from Old System

### Legacy Data Support
The system automatically converts old format to new format:

```typescript
// Old format
{
  selectedLayouts: { header: 'header-1', hero: 'hero-2' },
  pageStructure: 'single',
  customPages: ['صفحه اصلی']
}

// New format
{
  dynamicDesign: {
    pages: [{
      id: 'main',
      name: 'صفحه اصلی',
      sections: [
        { id: 'header-0', sectionType: 'header', layoutId: 'header-1', order: 0 },
        { id: 'hero-1', sectionType: 'hero', layoutId: 'hero-2', order: 1 }
      ],
      canvasDimensions: { width: 1200, height: 800 }
    }],
    currentPageId: 'main'
  }
}
```

## Future Enhancements

### 🎯 **Planned Features**
- **Drag & Drop**: Visual drag-and-drop interface
- **Custom Content**: Allow users to add custom text and images
- **Template Categories**: Subcategories within each section type
- **Search & Filter**: Find templates by tags and descriptions
- **Template Customization**: Modify template properties
- **Real-time Preview**: Live preview as you design
- **Export Options**: Export as HTML, PDF, or images

### 🔧 **Technical Improvements**
- **WebGL Rendering**: Hardware-accelerated canvas rendering
- **Undo/Redo**: Design history management
- **Collaboration**: Real-time collaborative editing
- **Version Control**: Design version management
- **A/B Testing**: Test different layouts

## Benefits

### For Users
- **Flexibility**: Create any layout combination
- **Ease of Use**: Intuitive drag-and-drop interface
- **Real-time Preview**: See changes immediately
- **Multi-page Support**: Create complex multi-page sites

### For Developers
- **Maintainability**: Modular, well-organized code
- **Performance**: Lazy loading and code splitting
- **Scalability**: Easy to add new templates and features
- **Type Safety**: Full TypeScript support

### For Business
- **User Experience**: Better design process
- **Conversion**: More engaging design tool
- **Efficiency**: Faster design creation
- **Competitive Advantage**: Modern, flexible design system 