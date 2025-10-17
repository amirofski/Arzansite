import React from 'react';
import Layout from "@/components/ui/Layout";
import { PaymentCallbackHandler } from '@/components/PaymentCallbackHandler';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <Helmet>
        <title>بازگشت از درگاه پرداخت - ارزان سایت</title>
        <meta name="description" content="تایید و پردازش نتیجه پرداخت شما" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                نتیجه پرداخت
              </CardTitle>
              <CardDescription>
                در حال بررسی وضعیت تراکنش شما هستیم. این فرایند چند لحظه زمان می‌برد.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentCallbackHandler />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentCallback;
