import { ShoppingCart, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/full-logo.png";
import LogoSelector from "@/components/LogoSelector";

import { useCart } from "@/contexts/CartContext";
import SearchBar from "@/components/SearchBar";
import freteBanner from "@/assets/frete-gratis-banner.webp";


interface StoreHeaderProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

const StoreHeader = ({ onToggleMobileMenu, mobileMenuOpen }: StoreHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, setIsOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <div className="md:contents">
      <div className="md:hidden h-[60px]"></div> {/* Spacer for fixed mobile search bar */}

      {/* Mobile: fixed sticky bar with search, menu and cart icons */}
      <div className="fixed top-0 left-0 right-0 z-50 block w-full md:hidden shadow-md bg-header">
        <div className="flex items-center gap-2 px-3 py-2 w-full">
          <button
            onClick={onToggleMobileMenu}
            className="text-header-foreground flex-shrink-0"
            aria-label="Menu"
          >
            <Menu className="h-7 w-7" />
          </button>
          
          <div className="flex-1 min-w-0">
            <SearchBar placeholder="Buscar" />
          </div>
          
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center text-header-foreground transition-opacity hover:opacity-80 flex-shrink-0"
            aria-label="Carrinho"
          >
            <div className="relative">
              <ShoppingCart className="h-7 w-7" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white leading-none">
                {totalItems}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile-only logo and banner (scrollable, not fixed) */}
      <div className="md:hidden">
        <div className="bg-header">
          <img src={freteBanner} alt="Frete grátis para todo Brasil" className="w-full h-auto block" loading="lazy"/>
        </div>
        <div className="bg-header py-4 flex justify-center border-b border-white/10">
          <Link to="/" className="no-underline">
            <LogoSelector src={logo} alt="Tendência Cosméticos" className="h-[40px] w-auto" />
          </Link>
        </div>
      </div>







      {/* Desktop header */}
      <header className="hidden md:block w-full bg-header sticky top-0 z-50 border-b border-border py-4">
        <div className="container-page">
          <div className="relative flex items-center justify-between">
            <Link to="/" className="no-underline flex-shrink-0">
              <LogoSelector src={logo} alt="Tendência Cosméticos" className="h-[52px] w-auto" />
            </Link>

            <div className="mx-8 max-w-xl flex-1">
              <SearchBar />
            </div>


            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center text-header-foreground transition-opacity hover:opacity-80"
              aria-label="Carrinho"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white leading-none">
                  {totalItems}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default StoreHeader;
