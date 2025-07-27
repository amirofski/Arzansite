import React from 'react';
import { SkeletonTemplate } from './index';

// Footer Template Components
const FooterSimple: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-24 bg-gray-800 rounded-b-lg flex items-center justify-between px-6 ${className}`}>
    <div className="w-32 h-6 bg-gray-600 rounded"></div>
    <div className="flex gap-4">
      <div className="w-16 h-4 bg-gray-600 rounded"></div>
      <div className="w-16 h-4 bg-gray-600 rounded"></div>
      <div className="w-16 h-4 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const FooterFull: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-32 bg-gray-800 rounded-b-lg p-6 ${className}`}>
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
        <div className="w-16 h-3 bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="w-48 h-3 bg-gray-600 rounded"></div>
  </div>
);

const FooterModern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-28 bg-gradient-to-r from-gray-900 to-gray-800 rounded-b-lg flex items-center justify-between px-6 ${className}`}>
    <div className="w-32 h-6 bg-gray-600 rounded"></div>
    <div className="flex gap-6">
      <div className="w-6 h-6 bg-gray-600 rounded"></div>
      <div className="w-6 h-6 bg-gray-600 rounded"></div>
      <div className="w-6 h-6 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const FooterMinimal: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-16 bg-white border rounded-b-lg flex items-center justify-center ${className}`}>
    <div className="w-48 h-4 bg-gray-300 rounded"></div>
  </div>
);

const FooterNewsletter: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-40 bg-gray-800 rounded-b-lg p-6 ${className}`}>
    <div className="text-center mb-6">
      <div className="w-32 h-5 bg-gray-600 rounded mb-2"></div>
      <div className="w-48 h-3 bg-gray-600 rounded"></div>
    </div>
    <div className="flex gap-3 justify-center mb-6">
      <div className="w-48 h-8 bg-gray-700 rounded"></div>
      <div className="w-20 h-8 bg-blue-500 rounded"></div>
    </div>
    <div className="flex justify-between items-center">
      <div className="w-32 h-4 bg-gray-600 rounded"></div>
      <div className="flex gap-3">
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
      </div>
    </div>
  </div>
);

const FooterGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-b-lg p-6 ${className}`}>
    <div className="grid grid-cols-3 gap-6 mb-4">
      <div className="space-y-2">
        <div className="w-20 h-4 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="w-20 h-4 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
        <div className="w-16 h-3 bg-white/30 rounded"></div>
      </div>
    </div>
    <div className="w-48 h-3 bg-white/30 rounded"></div>
  </div>
);

const FooterSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-800 rounded-b-lg ${className}`}>
    <div className="h-24 p-6 border-b border-gray-700">
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="w-20 h-4 bg-gray-600 rounded"></div>
          <div className="w-16 h-3 bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="w-20 h-4 bg-gray-600 rounded"></div>
          <div className="w-16 h-3 bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="w-20 h-4 bg-gray-600 rounded"></div>
          <div className="w-16 h-3 bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
    <div className="h-12 flex items-center justify-between px-6">
      <div className="w-32 h-4 bg-gray-600 rounded"></div>
      <div className="flex gap-3">
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
      </div>
    </div>
  </div>
);

const FooterContact: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-36 bg-gray-800 rounded-b-lg p-6 ${className}`}>
    <div className="grid grid-cols-2 gap-6 mb-4">
      <div className="space-y-3">
        <div className="w-24 h-4 bg-gray-600 rounded"></div>
        <div className="w-32 h-3 bg-gray-600 rounded"></div>
        <div className="w-28 h-3 bg-gray-600 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="w-24 h-4 bg-gray-600 rounded"></div>
        <div className="w-32 h-3 bg-gray-600 rounded"></div>
        <div className="w-28 h-3 bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="flex justify-between items-center">
      <div className="w-32 h-4 bg-gray-600 rounded"></div>
      <div className="flex gap-3">
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
        <div className="w-6 h-6 bg-gray-600 rounded"></div>
      </div>
    </div>
  </div>
);

const FooterLight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-28 bg-gray-100 rounded-b-lg p-6 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <div className="w-32 h-6 bg-gray-400 rounded"></div>
      <div className="flex gap-4">
        <div className="w-16 h-4 bg-gray-400 rounded"></div>
        <div className="w-16 h-4 bg-gray-400 rounded"></div>
        <div className="w-16 h-4 bg-gray-400 rounded"></div>
      </div>
    </div>
    <div className="w-48 h-3 bg-gray-400 rounded"></div>
  </div>
);

const footerTemplates: SkeletonTemplate[] = [
  {
    id: 'footer-1',
    name: 'فوتر ساده',
    description: 'طراحی ساده با لوگو و لینک‌های اصلی',
    category: 'footer',
    component: FooterSimple,
    tags: ['simple', 'minimal', 'clean']
  },
  {
    id: 'footer-2',
    name: 'فوتر کامل',
    description: 'فوتر کامل با ستون‌های متعدد',
    category: 'footer',
    component: FooterFull,
    tags: ['full', 'columns', 'comprehensive']
  },
  {
    id: 'footer-3',
    name: 'فوتر مدرن',
    description: 'طراحی مدرن با آیکون‌های شبکه‌های اجتماعی',
    category: 'footer',
    component: FooterModern,
    tags: ['modern', 'social', 'gradient']
  },
  {
    id: 'footer-4',
    name: 'فوتر مینیمال',
    description: 'طراحی مینیمال و تمیز',
    category: 'footer',
    component: FooterMinimal,
    tags: ['minimal', 'clean', 'simple']
  },
  {
    id: 'footer-5',
    name: 'فوتر خبرنامه',
    description: 'شامل فرم عضویت در خبرنامه',
    category: 'footer',
    component: FooterNewsletter,
    tags: ['newsletter', 'subscription', 'form']
  },
  {
    id: 'footer-6',
    name: 'فوتر گرادیانت',
    description: 'پس‌زمینه گرادیانت رنگی',
    category: 'footer',
    component: FooterGradient,
    tags: ['gradient', 'colorful', 'modern']
  },
  {
    id: 'footer-7',
    name: 'فوتر دو قسمتی',
    description: 'محتوای اصلی و کپی‌رایت جداگانه',
    category: 'footer',
    component: FooterSplit,
    tags: ['split', 'two-level', 'organized']
  },
  {
    id: 'footer-8',
    name: 'فوتر تماس',
    description: 'اطلاعات تماس و آدرس',
    category: 'footer',
    component: FooterContact,
    tags: ['contact', 'address', 'info']
  },
  {
    id: 'footer-9',
    name: 'فوتر روشن',
    description: 'طراحی روشن و تمیز',
    category: 'footer',
    component: FooterLight,
    tags: ['light', 'clean', 'bright']
  }
];

export default {
  id: 'footer',
  name: 'فوتر',
  description: 'قالب‌های مختلف برای بخش فوتر سایت',
  templates: footerTemplates
}; 