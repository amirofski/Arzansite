import React from 'react';
import Layout from "@/components/ui/Layout";
import { PaymentCallbackHandler } from '@/components/PaymentCallbackHandler';
import { useNavigate } from 'react-router-dom';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();

  const handlePaymentSuccess = () => {
    // Navigate to dashboard which will refresh orders
    navigate('/dashboard');
  };

  return (
    <Layout>
      <PaymentCallbackHandler onPaymentSuccess={handlePaymentSuccess} />
    </Layout>
  );
};

export default PaymentCallback;
