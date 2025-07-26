import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paintbrush, Layers } from 'lucide-react';
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
              <ModuleSelector data={data} updateData={updateData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignSelector;