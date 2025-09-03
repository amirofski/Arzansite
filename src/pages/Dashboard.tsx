import React from 'react';
import Layout from '@/components/ui/Layout';

const Dashboard: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">داشبورد</h1>
        <p className="text-muted-foreground mt-2">این صفحه به‌روزرسانی خواهد شد.</p>
      </div>
    </Layout>
  );
};

export default Dashboard;
