import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paintbrush, Layers, FileText, Files } from 'lucide-react';
import WireframeEditor from './WireframeEditor';
import ModuleSelector from './ModuleSelector';

interface DesignSelectorProps {
  data: any;
  updateData: (data: any) => void;
}

const DesignSelector = ({ data, updateData }: DesignSelectorProps) => {
  const [activeTab, setActiveTab] = useState<'wireframe' | 'modules'>('wireframe');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">طراحی سایت شما</h2>
        <p className="text-muted-foreground">
          یکی از روش‌های زیر را برای طراحی سایت خود انتخاب کنید
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'wireframe' | 'modules')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wireframe" className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4" />
            طراحی Wireframe
            <Badge variant="outline" className="text-xs">پیشرفته</Badge>
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            انتخاب از قالب‌ها
            <Badge variant="outline" className="text-xs">آسان</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wireframe" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5" />
                طراحی سفارشی با Wireframe
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                صفحات سایت خود را به صورت دستی طراحی کنید و عناصر مورد نظر را قرار دهید
              </p>
            </CardHeader>
            <CardContent>
              <WireframeEditor data={data} updateData={updateData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                انتخاب از ماژول‌های آماده
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ماژول‌های مورد نیاز خود را انتخاب کنید و ما طراحی را برای شما انجام می‌دهیم
              </p>
            </CardHeader>
            <CardContent>
              {/* Page Mode Selection */}
              <div className="mb-8 p-6 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-center">نوع ساختار سایت</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  نوع ساختار سایت خود را انتخاب کنید (هر دو گزینه قیمت یکسانی دارند)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={data.pageMode === 'single' ? 'default' : 'outline'}
                    onClick={() => updateData({ pageMode: 'single' })}
                    className="h-auto p-6 flex flex-col items-center gap-3"
                  >
                    <FileText className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">تک صفحه‌ای</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        تمام محتوا در یک صفحه طولانی
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      مناسب برای لندینگ پیج
                    </Badge>
                  </Button>
                  
                  <Button
                    variant={data.pageMode === 'multi' ? 'default' : 'outline'}
                    onClick={() => updateData({ pageMode: 'multi' })}
                    className="h-auto p-6 flex flex-col items-center gap-3"
                  >
                    <Files className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-semibold">چند صفحه‌ای</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        محتوا در صفحات جداگانه
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      مناسب برای سایت کامل
                    </Badge>
                  </Button>
                </div>
              </div>

              <ModuleSelector data={data} updateData={updateData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignSelector;