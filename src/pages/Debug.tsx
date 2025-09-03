import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/ui/Layout';
import AuthFlowTest from '@/components/AuthFlowTest';
import BackendConnectionTest from '@/components/BackendConnectionTest';
import DebugApiTest from '@/components/DebugApiTest';
import AuthenticationStatus from '@/components/AuthenticationStatus';
import SimplePingTest from '@/components/SimplePingTest';
import AuthDebugger from '@/components/debug/AuthDebugger';
 

const Debug = () => {
  return (
    <Layout>
      <Helmet>
        <title>Debug Tools</title>
      </Helmet>
      <div className="container mx-auto px-4 pt-32 pb-10 space-y-6">
        <h1 className="text-3xl font-bold">Debug Tools</h1>
        <p className="text-muted-foreground">Authentication and backend connectivity diagnostics.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AuthenticationStatus />
          <SimplePingTest />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AuthDebugger />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AuthFlowTest />
          <BackendConnectionTest />
          <DebugApiTest />
        </div>
      </div>
    </Layout>
  );
};

export default Debug;


