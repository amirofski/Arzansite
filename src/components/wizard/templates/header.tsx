import React from 'react';
import { SkeletonTemplate } from './index';

// Header Template Components
const HeaderMinimal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-16 bg-gray-100 rounded-t-lg flex items-center justify-between px-4 ${className}`}>
    <div className="w-20 h-8 bg-gray-300 rounded"></div>
    <div className="flex gap-4">
      <div className="w-12 h-4 bg-gray-300 rounded"></div>
      <div className="w-12 h-4 bg-gray-300 rounded"></div>
      <div className="w-12 h-4 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const HeaderModern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-20 bg-gray-800 rounded-t-lg flex items-center justify-between px-6 ${className}`}>
    <div className="w-24 h-10 bg-gray-600 rounded"></div>
    <div className="flex gap-6">
      <div className="w-16 h-6 bg-gray-600 rounded"></div>
      <div className="w-16 h-6 bg-gray-600 rounded"></div>
      <div className="w-20 h-8 bg-blue-500 rounded"></div>
    </div>
  </div>
);

const HeaderEcommerce: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-24 bg-white border rounded-t-lg ${className}`}>
    <div className="h-12 flex items-center justify-between px-4 border-b">
      <div className="w-28 h-8 bg-gray-300 rounded"></div>
      <div className="flex gap-2">
        <div className="w-32 h-8 bg-gray-200 rounded"></div>
        <div className="w-16 h-8 bg-green-500 rounded"></div>
      </div>
    </div>
    <div className="h-12 flex items-center px-4">
      <div className="flex gap-6">
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const HeaderGlass: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur rounded-t-lg flex items-center justify-between px-4 ${className}`}>
    <div className="w-20 h-8 bg-white/30 rounded"></div>
    <div className="flex gap-4">
      <div className="w-12 h-4 bg-white/30 rounded"></div>
      <div className="w-12 h-4 bg-white/30 rounded"></div>
      <div className="w-12 h-4 bg-white/30 rounded"></div>
    </div>
  </div>
);

const HeaderCentered: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-20 bg-white border-b rounded-t-lg flex items-center justify-center ${className}`}>
    <div className="flex items-center gap-8">
      <div className="w-16 h-6 bg-gray-300 rounded"></div>
      <div className="w-24 h-10 bg-gray-200 rounded"></div>
      <div className="w-16 h-6 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const HeaderSidebar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-16 bg-gray-900 rounded-t-lg flex items-center px-4 ${className}`}>
    <div className="w-8 h-8 bg-gray-600 rounded mr-4"></div>
    <div className="w-32 h-6 bg-gray-600 rounded"></div>
    <div className="flex-1"></div>
    <div className="flex gap-3">
      <div className="w-6 h-6 bg-gray-600 rounded"></div>
      <div className="w-6 h-6 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const HeaderSticky: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-16 bg-white shadow-lg rounded-t-lg flex items-center justify-between px-6 ${className}`}>
    <div className="w-28 h-8 bg-gray-300 rounded"></div>
    <div className="flex gap-6">
      <div className="w-16 h-4 bg-gray-300 rounded"></div>
      <div className="w-16 h-4 bg-gray-300 rounded"></div>
      <div className="w-16 h-4 bg-gray-300 rounded"></div>
      <div className="w-16 h-4 bg-gray-300 rounded"></div>
    </div>
    <div className="w-20 h-8 bg-blue-500 rounded"></div>
  </div>
);

const HeaderGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg flex items-center justify-between px-6 ${className}`}>
    <div className="w-24 h-10 bg-white/20 rounded"></div>
    <div className="flex gap-6">
      <div className="w-16 h-6 bg-white/30 rounded"></div>
      <div className="w-16 h-6 bg-white/30 rounded"></div>
      <div className="w-16 h-6 bg-white/30 rounded"></div>
    </div>
    <div className="w-20 h-8 bg-white rounded"></div>
  </div>
);

const HeaderSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-20 bg-white border rounded-t-lg ${className}`}>
    <div className="h-10 flex items-center justify-between px-4 border-b">
      <div className="w-20 h-6 bg-gray-300 rounded"></div>
      <div className="flex gap-3">
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
      </div>
    </div>
    <div className="h-10 flex items-center justify-center px-4">
      <div className="flex gap-8">
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const HeaderMinimalDark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-16 bg-gray-900 rounded-t-lg flex items-center justify-between px-6 ${className}`}>
    <div className="w-24 h-8 bg-gray-700 rounded"></div>
    <div className="flex gap-6">
      <div className="w-16 h-4 bg-gray-700 rounded"></div>
      <div className="w-16 h-4 bg-gray-700 rounded"></div>
      <div className="w-16 h-4 bg-gray-700 rounded"></div>
    </div>
  </div>
);

const headerTemplates: SkeletonTemplate[] = [
  {
    id: 'header-1',
    name: 'هدر مینیمال',
    description: 'طراحی ساده و تمیز برای سایت‌های مدرن',
    category: 'header',
    component: HeaderMinimal,
    tags: ['minimal', 'clean', 'modern']
  },
  {
    id: 'header-2',
    name: 'هدر مدرن',
    description: 'طراحی تیره با دکمه‌های برجسته',
    category: 'header',
    component: HeaderModern,
    tags: ['dark', 'modern', 'bold']
  },
  {
    id: 'header-3',
    name: 'هدر فروشگاهی',
    description: 'مناسب برای سایت‌های تجارت الکترونیک',
    category: 'header',
    component: HeaderEcommerce,
    tags: ['ecommerce', 'shopping', 'business']
  },
  {
    id: 'header-4',
    name: 'هدر شیشه‌ای',
    description: 'طراحی شفاف با افکت شیشه‌ای',
    category: 'header',
    component: HeaderGlass,
    tags: ['glass', 'transparent', 'modern']
  },
  {
    id: 'header-5',
    name: 'هدر مرکزی',
    description: 'لوگو در مرکز با منوهای جانبی',
    category: 'header',
    component: HeaderCentered,
    tags: ['centered', 'balanced', 'elegant']
  },
  {
    id: 'header-6',
    name: 'هدر سایدبار',
    description: 'منوی همبرگری با آیکون‌های کناری',
    category: 'header',
    component: HeaderSidebar,
    tags: ['sidebar', 'hamburger', 'mobile-friendly']
  },
  {
    id: 'header-7',
    name: 'هدر چسبان',
    description: 'هدر ثابت با سایه و منوهای کامل',
    category: 'header',
    component: HeaderSticky,
    tags: ['sticky', 'fixed', 'professional']
  },
  {
    id: 'header-8',
    name: 'هدر گرادیانت',
    description: 'رنگ‌های گرادیانت جذاب',
    category: 'header',
    component: HeaderGradient,
    tags: ['gradient', 'colorful', 'attractive']
  },
  {
    id: 'header-9',
    name: 'هدر دو قسمتی',
    description: 'منوی بالا و پایین جداگانه',
    category: 'header',
    component: HeaderSplit,
    tags: ['split', 'two-level', 'organized']
  },
  {
    id: 'header-10',
    name: 'هدر مینیمال تیره',
    description: 'طراحی ساده با تم تیره',
    category: 'header',
    component: HeaderMinimalDark,
    tags: ['dark', 'minimal', 'simple']
  }
];

export default {
  id: 'header',
  name: 'هدر',
  description: 'قالب‌های مختلف برای بخش هدر سایت',
  templates: headerTemplates
}; 