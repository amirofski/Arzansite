import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { discoverAllImages, getCategoryStats, DiscoveredCategory } from '@/lib/imageDiscovery';
import { SECTION_NAMES, getSectionCategories, SectionCategory, getImageCacheStatus, clearAllImageCaches, getEfficientDiscoveryStats, getCategoryImageInfo } from '@/lib/imageLoader';
import { getImageTemplatesByCategory, SkeletonTemplate } from './templates-del';

const ImageSystemTest = () => {
  const [discoveredCategories, setDiscoveredCategories] = useState<DiscoveredCategory[]>([]);
  const [sectionCategories, setSectionCategories] = useState<SectionCategory[]>([]);
  const [imageTemplates, setImageTemplates] = useState<Record<string, SkeletonTemplate[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<Record<string, unknown>>({});
  const [efficientStats, setEfficientStats] = useState<ReturnType<typeof getEfficientDiscoveryStats> | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load discovered images
      const discovered = await discoverAllImages();
      setDiscoveredCategories(discovered);
      
      // Load section categories
      const sections = await getSectionCategories();
      setSectionCategories(sections);
      
      // Test image template loading for a few categories
      const testCategories = ['headers', 'hero', 'footer'];
      const templates: Record<string, SkeletonTemplate[]> = {};
      
      for (const category of testCategories) {
        try {
          const temps = await getImageTemplatesByCategory(category);
          templates[category] = temps;
          console.log(`✅ Successfully loaded ${temps.length} templates for ${category}`);
        } catch (err) {
          console.error(`❌ Failed to load templates for ${category}:`, err);
          templates[category] = [];
        }
      }
      
      setImageTemplates(templates);
      
      // Update cache status
      setCacheStatus(getImageCacheStatus());
      
      // Load efficient discovery stats
      setEfficientStats(getEfficientDiscoveryStats());
    } catch (err) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCacheStatus = () => {
    setCacheStatus(getImageCacheStatus());
  };

  const handleClearAllCaches = () => {
    clearAllImageCaches();
    setCacheStatus({});
    setImageTemplates({});
    console.log('🗑️ All caches cleared');
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const stats = getCategoryStats(discoveredCategories);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Image System Test</h1>
        <div className="flex items-center gap-2">
          <Button onClick={refreshCacheStatus} variant="outline">
            🔄 Refresh Cache
          </Button>
          <Button onClick={handleClearAllCaches} variant="destructive">
            🗑️ Clear All Caches
          </Button>
          <Button onClick={loadAllData} disabled={loading}>
            {loading ? 'Loading...' : 'Reload'}
          </Button>
        </div>
      </div>

      {/* SECTION_NAMES Display */}
      <Card>
        <CardHeader>
          <CardTitle>SECTION_NAMES from imageLoader.ts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(SECTION_NAMES).map(([id, name]) => (
              <div key={id} className="p-2 border rounded text-sm">
                <div className="font-mono text-xs text-gray-500">{id}</div>
                <div>{name}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Total sections: {Object.keys(SECTION_NAMES).length}
          </div>
        </CardContent>
      </Card>

             {/* Statistics */}
       <Card>
         <CardHeader>
           <CardTitle>System Statistics</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="text-center">
               <div className="text-2xl font-bold text-blue-600">{stats.totalCategories}</div>
               <div className="text-sm text-gray-600">Total Categories</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-green-600">{stats.validImages}</div>
               <div className="text-sm text-gray-600">Valid Images</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-purple-600">{stats.categoriesWithImages}</div>
               <div className="text-sm text-gray-600">Categories with Images</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-orange-600">
                 {Math.round(stats.averageImagesPerCategory * 10) / 10}
               </div>
               <div className="text-sm text-gray-600">Avg Images/Category</div>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Efficient Discovery Stats */}
       {efficientStats && (
         <Card>
           <CardHeader>
             <CardTitle>🚀 Efficient Discovery System</CardTitle>
             <p className="text-sm text-muted-foreground">
               No unnecessary HEAD requests - uses known image ranges
             </p>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="text-center">
                 <div className="text-2xl font-bold text-emerald-600">{efficientStats.totalCategories}</div>
                 <div className="text-sm text-gray-600">Total Categories</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-teal-600">{efficientStats.totalImages}</div>
                 <div className="text-sm text-gray-600">Total Images</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-cyan-600">{efficientStats.averageImagesPerCategory}</div>
                 <div className="text-sm text-gray-600">Avg Images/Category</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-indigo-600">
                   <span className="text-sm">~{Math.round(efficientStats.totalImages * 0.5)}MB</span>
                 </div>
                 <div className="text-sm text-gray-600">Estimated Size</div>
               </div>
             </div>
             
             {/* Category Breakdown */}
             <div className="mt-6">
               <h4 className="font-medium mb-3">Category Breakdown:</h4>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                 {efficientStats.categories.map((cat: { category: string; count: number; path: string }) => (
                   <div key={cat.category} className="p-2 border rounded text-sm">
                     <div className="font-medium">{SECTION_NAMES[cat.category] || cat.category}</div>
                     <div className="text-xs text-gray-600">{cat.count} images</div>
                   </div>
                 ))}
               </div>
             </div>
           </CardContent>
         </Card>
       )}

      {/* Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Cache Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(cacheStatus).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No cached images found. Images will be cached when you select sections.
              </div>
            ) : (
              Object.entries(cacheStatus).map(([category, info]) => (
                <div key={category} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{SECTION_NAMES[category] || category}</h4>
                    <Badge variant="default">
                      {(info as { imageCount?: number })?.imageCount || 0} images
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>🕒 {(info as { ageFormatted?: string })?.ageFormatted || 'Unknown'}</div>
                    <div>📦 Cached in browser storage</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Loading Test */}
      <Card>
        <CardHeader>
          <CardTitle>Template Loading Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(imageTemplates).map(([category, templates]) => (
              <div key={category} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{SECTION_NAMES[category] || category}</h4>
                  <Badge variant={templates.length > 0 ? "default" : "destructive"}>
                    {templates.length} templates
                  </Badge>
                </div>
                {templates.length > 0 ? (
                  <div className="text-sm text-gray-600">
                    ✅ Successfully loaded {templates.length} templates
                    {templates.length > 0 && (
                      <div className="mt-1">
                        Sample: {templates[0]?.name} (ID: {templates[0]?.id})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    ❌ No templates loaded
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (for debugging)</CardTitle>
        </CardHeader>
        <CardContent>
          <details className="space-y-4">
            <summary className="cursor-pointer font-medium">Discovered Categories</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(discoveredCategories, null, 2)}
            </pre>
          </details>
          
          <details className="space-y-4 mt-4">
            <summary className="cursor-pointer font-medium">Section Categories</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(sectionCategories, null, 2)}
            </pre>
          </details>
          
          <details className="space-y-4 mt-4">
            <summary className="cursor-pointer font-medium">Image Templates</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(imageTemplates, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageSystemTest;
