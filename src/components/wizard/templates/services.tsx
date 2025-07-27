import React from 'react';
import { SkeletonTemplate } from './index';

// Services Template Components
const ServicesCards: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-24 bg-gray-50 rounded p-3 space-y-2">
        <div className="w-8 h-8 bg-blue-500 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="h-24 bg-gray-50 rounded p-3 space-y-2">
        <div className="w-8 h-8 bg-green-500 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="h-24 bg-gray-50 rounded p-3 space-y-2">
        <div className="w-8 h-8 bg-purple-500 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const ServicesList: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-blue-500 rounded"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-green-500 rounded"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-purple-500 rounded"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const ServicesGrid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="h-16 bg-gray-50 rounded p-2">
        <div className="w-12 h-3 bg-gray-300 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="h-16 bg-gray-50 rounded p-2">
        <div className="w-12 h-3 bg-gray-300 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="h-16 bg-gray-50 rounded p-2">
        <div className="w-12 h-3 bg-gray-300 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="h-16 bg-gray-50 rounded p-2">
        <div className="w-12 h-3 bg-gray-300 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const ServicesTeam: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="flex gap-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
        <div className="w-12 h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
        <div className="w-12 h-2 bg-gray-300 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
        <div className="w-12 h-2 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const ServicesIcons: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="grid grid-cols-4 gap-4">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 bg-blue-500 rounded mx-auto"></div>
        <div className="w-12 h-2 bg-gray-300 rounded mx-auto"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-10 h-10 bg-green-500 rounded mx-auto"></div>
        <div className="w-12 h-2 bg-gray-300 rounded mx-auto"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-10 h-10 bg-purple-500 rounded mx-auto"></div>
        <div className="w-12 h-2 bg-gray-300 rounded mx-auto"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-10 h-10 bg-orange-500 rounded mx-auto"></div>
        <div className="w-12 h-2 bg-gray-300 rounded mx-auto"></div>
      </div>
    </div>
  </div>
);

const ServicesGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-white/30 rounded mb-4"></div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-24 bg-white/10 rounded p-3 space-y-2">
        <div className="w-8 h-8 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
        <div className="w-full h-2 bg-white/30 rounded"></div>
      </div>
      <div className="h-24 bg-white/10 rounded p-3 space-y-2">
        <div className="w-8 h-8 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
        <div className="w-full h-2 bg-white/30 rounded"></div>
      </div>
      <div className="h-24 bg-white/10 rounded p-3 space-y-2">
        <div className="w-8 h-8 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
        <div className="w-full h-2 bg-white/30 rounded"></div>
      </div>
    </div>
  </div>
);

const ServicesSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg flex ${className}`}>
    <div className="flex-1 p-6 space-y-3">
      <div className="w-32 h-5 bg-gray-300 rounded"></div>
      <div className="w-full h-3 bg-gray-300 rounded"></div>
      <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
    </div>
    <div className="w-1/3 bg-gray-100 rounded-r-lg p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <div className="w-16 h-2 bg-gray-300 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <div className="w-16 h-2 bg-gray-300 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <div className="w-16 h-2 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const ServicesTimeline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
        <div className="flex-1">
          <div className="w-24 h-3 bg-gray-300 rounded mb-1"></div>
          <div className="w-32 h-2 bg-gray-300 rounded"></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-green-500 rounded-full"></div>
        <div className="flex-1">
          <div className="w-24 h-3 bg-gray-300 rounded mb-1"></div>
          <div className="w-32 h-2 bg-gray-300 rounded"></div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
        <div className="flex-1">
          <div className="w-24 h-3 bg-gray-300 rounded mb-1"></div>
          <div className="w-32 h-2 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const servicesTemplates: SkeletonTemplate[] = [
  {
    id: 'services-1',
    name: 'خدمات کارت‌ای',
    description: 'خدمات در قالب کارت‌های جداگانه',
    category: 'services',
    component: ServicesCards,
    tags: ['cards', 'grid', 'organized']
  },
  {
    id: 'services-2',
    name: 'خدمات لیست',
    description: 'لیست ساده خدمات',
    category: 'services',
    component: ServicesList,
    tags: ['list', 'simple', 'clean']
  },
  {
    id: 'services-3',
    name: 'خدمات گرید',
    description: 'نمایش خدمات در قالب گرید',
    category: 'services',
    component: ServicesGrid,
    tags: ['grid', 'layout', 'structured']
  },
  {
    id: 'services-4',
    name: 'خدمات تیمی',
    description: 'نمایش خدمات با تصاویر تیم',
    category: 'services',
    component: ServicesTeam,
    tags: ['team', 'avatars', 'personal']
  },
  {
    id: 'services-5',
    name: 'خدمات آیکونی',
    description: 'خدمات با آیکون‌های رنگی',
    category: 'services',
    component: ServicesIcons,
    tags: ['icons', 'colorful', 'visual']
  },
  {
    id: 'services-6',
    name: 'خدمات گرادیانت',
    description: 'پس‌زمینه گرادیانت با کارت‌های شفاف',
    category: 'services',
    component: ServicesGradient,
    tags: ['gradient', 'transparent', 'modern']
  },
  {
    id: 'services-7',
    name: 'خدمات دو قسمتی',
    description: 'توضیحات و لیست خدمات جداگانه',
    category: 'services',
    component: ServicesSplit,
    tags: ['split', 'two-section', 'balanced']
  },
  {
    id: 'services-8',
    name: 'خدمات تایم‌لاین',
    description: 'نمایش خدمات به صورت تایم‌لاین',
    category: 'services',
    component: ServicesTimeline,
    tags: ['timeline', 'process', 'steps']
  }
];

export default {
  id: 'services',
  name: 'خدمات',
  description: 'قالب‌های مختلف برای بخش خدمات سایت',
  templates: servicesTemplates
}; 