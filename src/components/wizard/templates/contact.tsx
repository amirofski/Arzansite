import React from 'react';
import { SkeletonTemplate } from './index';

// Contact Template Components
const ContactSimple: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 space-y-4 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded"></div>
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

const ContactWithMap: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg flex ${className}`}>
    <div className="flex-1 p-6 space-y-3">
      <div className="w-32 h-5 bg-gray-300 rounded"></div>
      <div className="w-24 h-3 bg-gray-300 rounded"></div>
      <div className="w-32 h-3 bg-gray-300 rounded"></div>
      <div className="w-28 h-3 bg-gray-300 rounded"></div>
    </div>
    <div className="w-32 bg-gray-200 rounded-r-lg"></div>
  </div>
);

const ContactForm: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="w-full h-8 bg-gray-100 rounded"></div>
      <div className="w-full h-8 bg-gray-100 rounded"></div>
      <div className="w-full h-16 bg-gray-100 rounded"></div>
      <div className="w-24 h-8 bg-blue-500 rounded"></div>
    </div>
  </div>
);

const ContactFull: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-300 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="w-24 h-3 bg-gray-300 rounded"></div>
        <div className="w-32 h-3 bg-gray-300 rounded"></div>
        <div className="w-28 h-3 bg-gray-300 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-8 bg-gray-100 rounded"></div>
        <div className="w-full h-8 bg-gray-100 rounded"></div>
        <div className="w-24 h-8 bg-blue-500 rounded"></div>
      </div>
    </div>
  </div>
);

const ContactCards: React.FC<{ className?: string }> = ({ className = '' }) => (
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

const ContactGradient: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-white/30 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="w-24 h-3 bg-white/30 rounded"></div>
        <div className="w-32 h-3 bg-white/30 rounded"></div>
        <div className="w-28 h-3 bg-white/30 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-8 bg-white/20 rounded"></div>
        <div className="w-full h-8 bg-white/20 rounded"></div>
        <div className="w-24 h-8 bg-white rounded"></div>
      </div>
    </div>
  </div>
);

const ContactSplit: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-white rounded-lg flex ${className}`}>
    <div className="flex-1 p-6 space-y-3">
      <div className="w-32 h-5 bg-gray-300 rounded"></div>
      <div className="w-full h-3 bg-gray-300 rounded"></div>
      <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
    </div>
    <div className="w-1/3 bg-gray-100 rounded-r-lg p-4">
      <div className="space-y-3">
        <div className="w-full h-8 bg-gray-200 rounded"></div>
        <div className="w-full h-8 bg-gray-200 rounded"></div>
        <div className="w-20 h-8 bg-blue-500 rounded"></div>
      </div>
    </div>
  </div>
);

const ContactModern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-48 bg-gray-900 rounded-lg p-6 ${className}`}>
    <div className="w-32 h-5 bg-gray-600 rounded mb-4"></div>
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded"></div>
          <div className="w-32 h-3 bg-gray-600 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <div className="w-32 h-3 bg-gray-600 rounded"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-8 bg-gray-800 rounded"></div>
        <div className="w-full h-8 bg-gray-800 rounded"></div>
        <div className="w-24 h-8 bg-blue-500 rounded"></div>
      </div>
    </div>
  </div>
);

const contactTemplates: SkeletonTemplate[] = [
  {
    id: 'contact-1',
    name: 'تماس ساده',
    description: 'لیست ساده اطلاعات تماس',
    category: 'contact',
    component: ContactSimple,
    tags: ['simple', 'list', 'clean']
  },
  {
    id: 'contact-2',
    name: 'تماس با نقشه',
    description: 'اطلاعات تماس همراه با نقشه',
    category: 'contact',
    component: ContactWithMap,
    tags: ['map', 'location', 'visual']
  },
  {
    id: 'contact-3',
    name: 'تماس فرم‌ای',
    description: 'فرم تماس کامل',
    category: 'contact',
    component: ContactForm,
    tags: ['form', 'input', 'submit']
  },
  {
    id: 'contact-4',
    name: 'تماس کامل',
    description: 'اطلاعات تماس و فرم در کنار هم',
    category: 'contact',
    component: ContactFull,
    tags: ['full', 'complete', 'comprehensive']
  },
  {
    id: 'contact-5',
    name: 'تماس کارت‌ای',
    description: 'اطلاعات تماس در قالب کارت‌های جداگانه',
    category: 'contact',
    component: ContactCards,
    tags: ['cards', 'grid', 'organized']
  },
  {
    id: 'contact-6',
    name: 'تماس گرادیانت',
    description: 'پس‌زمینه گرادیانت رنگی',
    category: 'contact',
    component: ContactGradient,
    tags: ['gradient', 'colorful', 'modern']
  },
  {
    id: 'contact-7',
    name: 'تماس دو قسمتی',
    description: 'توضیحات و فرم جداگانه',
    category: 'contact',
    component: ContactSplit,
    tags: ['split', 'two-section', 'balanced']
  },
  {
    id: 'contact-8',
    name: 'تماس مدرن',
    description: 'طراحی مدرن با تم تیره',
    category: 'contact',
    component: ContactModern,
    tags: ['modern', 'dark', 'elegant']
  }
];

export default {
  id: 'contact',
  name: 'تماس',
  description: 'قالب‌های مختلف برای بخش تماس سایت',
  templates: contactTemplates
}; 