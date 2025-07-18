import React from "react";
import { Helmet } from "react-helmet-async";
import { siteConfig } from "@/lib/siteConfig";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/ui/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <Helmet>
        <title>یافت نشد | {siteConfig.seo.defaultTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            Return to Home
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
