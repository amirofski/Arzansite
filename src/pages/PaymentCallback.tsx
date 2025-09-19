import React from 'react';
import Layout from "@/components/ui/Layout";
import { PaymentCallbackHandler } from '@/components/PaymentCallbackHandler';
import { useNavigate } from 'react-router-dom';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <PaymentCallbackHandler />
    </Layout>
  );
};

export default PaymentCallback;
