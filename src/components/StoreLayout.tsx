import { useState } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import StoreHeader from "@/components/StoreHeader";
import Navigation from "@/components/Navigation";

import Footer from "@/components/Footer";

import CookieConsent from "@/components/CookieConsent";

interface StoreLayoutProps {
  children: React.ReactNode;
}

const StoreLayout = ({ children }: StoreLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <StoreHeader
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <Navigation
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      {children}
      
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default StoreLayout;
