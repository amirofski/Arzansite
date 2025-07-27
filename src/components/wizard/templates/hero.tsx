import React from 'react';
import { SkeletonTemplate } from './index';

// Hero Template Components
const HeroCentered: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center ${className}`}>
    <div className="text-center space-y-4">
      <div className="w-64 h-8 bg-gray-300 rounded"></div>
      <div className="w-80 h-4 bg-gray-300 rounded"></div>
      <div className="w-32 h-10 bg-blue-500 rounded"></div>
    </div>
  </div>
);

const HeroSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gray-50 rounded-lg flex ${className}`}>
    <div className="flex-1 flex flex-col justify-center px-8 space-y-4">
      <div className="w-48 h-6 bg-gray-300 rounded"></div>
      <div className="w-64 h-4 bg-gray-300 rounded"></div>
      <div className="flex gap-3">
        <div className="w-24 h-8 bg-blue-500 rounded"></div>
        <div className="w-24 h-8 bg-gray-500 rounded"></div>
      </div>
    </div>
    <div className="flex-1 bg-gray-200 rounded-r-lg"></div>
  </div>
);

const HeroVideo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gray-900 rounded-lg relative flex items-center justify-center ${className}`}>
    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
      <div className="w-8 h-8 bg-white rounded"></div>
    </div>
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
      <div className="w-48 h-4 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const HeroCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center ${className}`}>
    <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center space-y-3">
      <div className="w-48 h-6 bg-white/30 rounded"></div>
      <div className="w-64 h-4 bg-white/30 rounded"></div>
      <div className="w-32 h-8 bg-white rounded"></div>
    </div>
  </div>
);

const HeroMinimal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white border rounded-lg flex items-center justify-center ${className}`}>
    <div className="text-center space-y-3">
      <div className="w-56 h-6 bg-gray-300 rounded"></div>
      <div className="w-72 h-3 bg-gray-300 rounded"></div>
      <div className="w-28 h-8 bg-blue-500 rounded"></div>
    </div>
  </div>
);

const HeroGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center ${className}`}>
    <div className="text-center space-y-4">
      <div className="w-64 h-8 bg-white/20 rounded"></div>
      <div className="w-80 h-4 bg-white/20 rounded"></div>
      <div className="flex gap-3 justify-center">
        <div className="w-24 h-8 bg-white rounded"></div>
        <div className="w-24 h-8 bg-white/20 rounded border border-white/30"></div>
      </div>
    </div>
  </div>
);

const HeroImage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gray-800 rounded-lg relative flex items-center ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
    <div className="relative z-10 px-8 space-y-4">
      <div className="w-48 h-6 bg-white/30 rounded"></div>
      <div className="w-64 h-4 bg-white/30 rounded"></div>
      <div className="w-32 h-8 bg-white rounded"></div>
    </div>
  </div>
);

const HeroStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-white border rounded-lg p-8 ${className}`}>
    <div className="text-center mb-8">
      <div className="w-48 h-6 bg-gray-300 rounded mb-3"></div>
      <div className="w-64 h-3 bg-gray-300 rounded"></div>
    </div>
    <div className="grid grid-cols-3 gap-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-8 bg-blue-500 rounded mx-auto"></div>
        <div className="w-20 h-3 bg-gray-300 rounded mx-auto"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-16 h-8 bg-green-500 rounded mx-auto"></div>
        <div className="w-20 h-3 bg-gray-300 rounded mx-auto"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-16 h-8 bg-purple-500 rounded mx-auto"></div>
        <div className="w-20 h-3 bg-gray-300 rounded mx-auto"></div>
      </div>
    </div>
  </div>
);

const HeroSidebar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-64 bg-gray-50 rounded-lg flex ${className}`}>
    <div className="w-1/3 bg-gray-200 rounded-l-lg flex items-center justify-center">
      <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
    </div>
    <div className="flex-1 flex flex-col justify-center px-8 space-y-4">
      <div className="w-48 h-6 bg-gray-300 rounded"></div>
      <div className="w-64 h-3 bg-gray-300 rounded"></div>
      <div className="w-56 h-3 bg-gray-300 rounded"></div>
      <div className="w-32 h-8 bg-blue-500 rounded"></div>
    </div>
  </div>
);

const HeroFullscreen: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-80 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-lg relative flex items-center justify-center ${className}`}>
    <div className="absolute inset-0 bg-black/20"></div>
    <div className="relative z-10 text-center space-y-6">
      <div className="w-72 h-8 bg-white/30 rounded"></div>
      <div className="w-96 h-4 bg-white/30 rounded"></div>
      <div className="w-80 h-3 bg-white/30 rounded"></div>
      <div className="flex gap-4 justify-center">
        <div className="w-28 h-10 bg-white rounded"></div>
        <div className="w-28 h-10 bg-white/20 rounded border border-white/30"></div>
      </div>
    </div>
  </div>
);

const heroTemplates: SkeletonTemplate[] = [
  {
    id: 'hero-1',
    name: 'هیرو مرکزی',
    description: 'طراحی مرکزی با پس‌زمینه گرادیانت ملایم',
    category: 'hero',
    component: HeroCentered,
    tags: ['centered', 'gradient', 'clean']
  },
  {
    id: 'hero-2',
    name: 'هیرو دو قسمتی',
    description: 'متن و تصویر در کنار هم',
    category: 'hero',
    component: HeroSplit,
    tags: ['split', 'text-image', 'balanced']
  },
  {
    id: 'hero-3',
    name: 'هیرو ویدیویی',
    description: 'طراحی مناسب برای پس‌زمینه ویدیو',
    category: 'hero',
    component: HeroVideo,
    tags: ['video', 'dark', 'play-button']
  },
  {
    id: 'hero-4',
    name: 'هیرو کارت‌ای',
    description: 'کارت شیشه‌ای روی پس‌زمینه رنگی',
    category: 'hero',
    component: HeroCard,
    tags: ['card', 'glass', 'colorful']
  },
  {
    id: 'hero-5',
    name: 'هیرو مینیمال',
    description: 'طراحی ساده و تمیز',
    category: 'hero',
    component: HeroMinimal,
    tags: ['minimal', 'simple', 'clean']
  },
  {
    id: 'hero-6',
    name: 'هیرو گرادیانت',
    description: 'پس‌زمینه گرادیانت رنگی جذاب',
    category: 'hero',
    component: HeroGradient,
    tags: ['gradient', 'colorful', 'modern']
  },
  {
    id: 'hero-7',
    name: 'هیرو تصویری',
    description: 'متن روی پس‌زمینه تصویر',
    category: 'hero',
    component: HeroImage,
    tags: ['image', 'overlay', 'text-overlay']
  },
  {
    id: 'hero-8',
    name: 'هیرو آماری',
    description: 'نمایش آمار و ارقام',
    category: 'hero',
    component: HeroStats,
    tags: ['stats', 'numbers', 'data']
  },
  {
    id: 'hero-9',
    name: 'هیرو سایدبار',
    description: 'تصویر در کنار متن',
    category: 'hero',
    component: HeroSidebar,
    tags: ['sidebar', 'image-text', 'layout']
  },
  {
    id: 'hero-10',
    name: 'هیرو تمام صفحه',
    description: 'طراحی تمام صفحه با محتوای غنی',
    category: 'hero',
    component: HeroFullscreen,
    tags: ['fullscreen', 'rich', 'immersive']
  }
];

export default {
  id: 'hero',
  name: 'بخش اصلی',
  description: 'قالب‌های مختلف برای بخش هیرو سایت',
  templates: heroTemplates
}; 