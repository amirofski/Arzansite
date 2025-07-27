import React from 'react';
import { SkeletonTemplate } from './index';

// About Template Components
const AboutSimple: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 space-y-4 ${className}`}>
    <div className="w-32 h-6 bg-gray-300 rounded"></div>
    <div className="w-full h-4 bg-gray-300 rounded"></div>
    <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
    <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
  </div>
);

const AboutWithImage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg flex gap-6 p-6 ${className}`}>
    <div className="w-32 h-32 bg-gray-200 rounded"></div>
    <div className="flex-1 space-y-3">
      <div className="w-32 h-5 bg-gray-300 rounded"></div>
      <div className="w-full h-3 bg-gray-300 rounded"></div>
      <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const AboutTeam: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="flex gap-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="w-20 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="w-20 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="w-20 h-3 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const AboutStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-6"></div>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-8 bg-blue-500 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-12 h-8 bg-green-500 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="text-center space-y-2">
        <div className="w-12 h-8 bg-purple-500 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const AboutTimeline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const AboutCards: React.FC<{ className?: string }> = ({ className = '' }) => (
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

const AboutGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-white/30 rounded mb-4"></div>
    <div className="w-full h-4 bg-white/30 rounded mb-3"></div>
    <div className="w-3/4 h-4 bg-white/30 rounded mb-3"></div>
    <div className="w-1/2 h-4 bg-white/30 rounded"></div>
  </div>
);

const AboutSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg flex ${className}`}>
    <div className="flex-1 p-6 space-y-3">
      <div className="w-32 h-5 bg-gray-300 rounded"></div>
      <div className="w-full h-3 bg-gray-300 rounded"></div>
      <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
    </div>
    <div className="w-1/3 bg-gray-100 rounded-r-lg flex items-center justify-center">
      <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
    </div>
  </div>
);

const aboutTemplates: SkeletonTemplate[] = [
  {
    id: 'about-1',
    name: 'درباره ساده',
    description: 'طراحی ساده و تمیز برای معرفی',
    category: 'about',
    component: AboutSimple,
    tags: ['simple', 'clean', 'text']
  },
  {
    id: 'about-2',
    name: 'درباره با تصویر',
    description: 'تصویر در کنار متن معرفی',
    category: 'about',
    component: AboutWithImage,
    tags: ['image', 'text', 'side-by-side']
  },
  {
    id: 'about-3',
    name: 'درباره تیمی',
    description: 'نمایش اعضای تیم',
    category: 'about',
    component: AboutTeam,
    tags: ['team', 'members', 'avatars']
  },
  {
    id: 'about-4',
    name: 'درباره آماری',
    description: 'نمایش آمار و ارقام',
    category: 'about',
    component: AboutStats,
    tags: ['stats', 'numbers', 'data']
  },
  {
    id: 'about-5',
    name: 'درباره تایم‌لاین',
    description: 'نمایش تاریخچه و مراحل',
    category: 'about',
    component: AboutTimeline,
    tags: ['timeline', 'history', 'steps']
  },
  {
    id: 'about-6',
    name: 'درباره کارت‌ای',
    description: 'اطلاعات در قالب کارت‌های جداگانه',
    category: 'about',
    component: AboutCards,
    tags: ['cards', 'grid', 'organized']
  },
  {
    id: 'about-7',
    name: 'درباره گرادیانت',
    description: 'پس‌زمینه گرادیانت رنگی',
    category: 'about',
    component: AboutGradient,
    tags: ['gradient', 'colorful', 'modern']
  },
  {
    id: 'about-8',
    name: 'درباره دو قسمتی',
    description: 'متن و تصویر در دو بخش جداگانه',
    category: 'about',
    component: AboutSplit,
    tags: ['split', 'two-section', 'balanced']
  }
];

export default {
  id: 'about',
  name: 'درباره',
  description: 'قالب‌های مختلف برای بخش درباره سایت',
  templates: aboutTemplates
}; 