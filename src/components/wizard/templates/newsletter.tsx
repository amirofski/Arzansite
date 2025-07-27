import React from 'react';
import { SkeletonTemplate } from './index';

// Newsletter Template Components
const NewsletterSimple: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-32 bg-gray-100 rounded-lg p-6 flex items-center justify-center ${className}`}>
    <div className="text-center space-y-3">
      <div className="w-48 h-5 bg-gray-300 rounded"></div>
      <div className="flex gap-2">
        <div className="w-32 h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-8 bg-blue-500 rounded"></div>
      </div>
    </div>
  </div>
);

const NewsletterWithImage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 flex items-center justify-center ${className}`}>
    <div className="text-center space-y-3">
      <div className="w-48 h-5 bg-white/30 rounded"></div>
      <div className="w-64 h-3 bg-white/30 rounded"></div>
      <div className="flex gap-2">
        <div className="w-32 h-8 bg-white rounded"></div>
        <div className="w-20 h-8 bg-white/20 rounded"></div>
      </div>
    </div>
  </div>
);

const NewsletterModern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-36 bg-white border rounded-lg p-6 ${className}`}>
    <div className="w-40 h-5 bg-gray-300 rounded mb-3"></div>
    <div className="w-56 h-3 bg-gray-300 rounded mb-4"></div>
    <div className="flex gap-2">
      <div className="flex-1 h-8 bg-gray-100 rounded"></div>
      <div className="w-20 h-8 bg-green-500 rounded"></div>
    </div>
  </div>
);

const NewsletterCards: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-24 bg-gray-50 rounded p-4 space-y-3">
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
        <div className="w-full h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-6 bg-blue-500 rounded"></div>
      </div>
      <div className="h-24 bg-gray-50 rounded p-4 space-y-3">
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
        <div className="w-full h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-6 bg-green-500 rounded"></div>
      </div>
    </div>
  </div>
);

const NewsletterGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg p-6 flex items-center justify-center ${className}`}>
    <div className="text-center space-y-4">
      <div className="w-56 h-6 bg-white/30 rounded"></div>
      <div className="w-72 h-4 bg-white/30 rounded"></div>
      <div className="flex gap-3 justify-center">
        <div className="w-40 h-10 bg-white rounded"></div>
        <div className="w-24 h-10 bg-white/20 rounded border border-white/30"></div>
      </div>
    </div>
  </div>
);

const NewsletterSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-36 bg-white border rounded-lg flex ${className}`}>
    <div className="flex-1 p-6 space-y-3">
      <div className="w-32 h-5 bg-gray-300 rounded"></div>
      <div className="w-48 h-3 bg-gray-300 rounded"></div>
    </div>
    <div className="w-1/3 bg-gray-50 rounded-r-lg p-6 flex items-center">
      <div className="w-full space-y-2">
        <div className="w-full h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-8 bg-blue-500 rounded"></div>
      </div>
    </div>
  </div>
);

const NewsletterDark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-40 bg-gray-900 rounded-lg p-6 flex items-center justify-center ${className}`}>
    <div className="text-center space-y-4">
      <div className="w-48 h-6 bg-gray-600 rounded"></div>
      <div className="w-64 h-4 bg-gray-600 rounded"></div>
      <div className="flex gap-3 justify-center">
        <div className="w-40 h-10 bg-gray-700 rounded"></div>
        <div className="w-24 h-10 bg-blue-500 rounded"></div>
      </div>
    </div>
  </div>
);

const NewsletterMinimal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-24 bg-gray-50 border rounded-lg flex items-center justify-center ${className}`}>
    <div className="flex gap-3">
      <div className="w-48 h-8 bg-gray-200 rounded"></div>
      <div className="w-16 h-8 bg-blue-500 rounded"></div>
    </div>
  </div>
);

const newsletterTemplates: SkeletonTemplate[] = [
  {
    id: 'newsletter-1',
    name: 'خبرنامه ساده',
    description: 'طراحی ساده و تمیز',
    category: 'newsletter',
    component: NewsletterSimple,
    tags: ['simple', 'clean', 'minimal']
  },
  {
    id: 'newsletter-2',
    name: 'خبرنامه با تصویر',
    description: 'پس‌زمینه گرادیانت رنگی',
    category: 'newsletter',
    component: NewsletterWithImage,
    tags: ['gradient', 'colorful', 'attractive']
  },
  {
    id: 'newsletter-3',
    name: 'خبرنامه مدرن',
    description: 'طراحی مدرن با فرم کامل',
    category: 'newsletter',
    component: NewsletterModern,
    tags: ['modern', 'form', 'complete']
  },
  {
    id: 'newsletter-4',
    name: 'خبرنامه کارت‌ای',
    description: 'دو کارت جداگانه برای خبرنامه',
    category: 'newsletter',
    component: NewsletterCards,
    tags: ['cards', 'grid', 'organized']
  },
  {
    id: 'newsletter-5',
    name: 'خبرنامه گرادیانت',
    description: 'پس‌زمینه گرادیانت زیبا',
    category: 'newsletter',
    component: NewsletterGradient,
    tags: ['gradient', 'beautiful', 'colorful']
  },
  {
    id: 'newsletter-6',
    name: 'خبرنامه دو قسمتی',
    description: 'توضیحات و فرم جداگانه',
    category: 'newsletter',
    component: NewsletterSplit,
    tags: ['split', 'two-section', 'balanced']
  },
  {
    id: 'newsletter-7',
    name: 'خبرنامه تیره',
    description: 'طراحی تیره و مدرن',
    category: 'newsletter',
    component: NewsletterDark,
    tags: ['dark', 'modern', 'elegant']
  },
  {
    id: 'newsletter-8',
    name: 'خبرنامه مینیمال',
    description: 'طراحی مینیمال و ساده',
    category: 'newsletter',
    component: NewsletterMinimal,
    tags: ['minimal', 'simple', 'clean']
  }
];

export default {
  id: 'newsletter',
  name: 'خبرنامه',
  description: 'قالب‌های مختلف برای بخش خبرنامه سایت',
  templates: newsletterTemplates
}; 