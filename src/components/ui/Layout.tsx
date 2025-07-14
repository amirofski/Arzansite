import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pb-8"> {/* pt-20 for header, pb-8 for footer spacing */}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 