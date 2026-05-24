import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  showViewAll?: boolean;
  categorySlug?: string;
}

const ProductSection = ({ title, subtitle, products, showViewAll = true, categorySlug }: ProductSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(0);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const compute = () => {
      const itemWidth = (el.firstElementChild as HTMLElement)?.offsetWidth || 0;
      if (!itemWidth) return;
      const perPage = Math.max(1, Math.round(el.clientWidth / itemWidth));
      const pages = Math.max(1, Math.ceil(products.length / perPage));
      setPageCount(pages);
      const page = Math.round(el.scrollLeft / (perPage * itemWidth));
      setActivePage(Math.min(pages - 1, page));
    };
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      el.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [products.length]);

  const goToPage = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = (el.firstElementChild as HTMLElement)?.offsetWidth || 0;
    const perPage = Math.max(1, Math.round(el.clientWidth / itemWidth));
    el.scrollTo({ left: i * perPage * itemWidth, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container-page">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 normal-case">{subtitle}</p>
            )}
          </div>
          {showViewAll && categorySlug && (
            <Link
              to={`/collections/${categorySlug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver tudo
            </Link>
          )}
        </div>

        {/* Scrollable products */}
        <div className="group relative">
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md transition-opacity hover:bg-secondary md:group-hover:flex"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-4"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md transition-opacity hover:bg-secondary md:group-hover:flex"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Dots indicator (mobile) */}
        {pageCount > 1 && (
          <div className="mt-2 flex justify-center gap-2 md:hidden">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                aria-label={`Página ${i + 1}`}
                onClick={() => goToPage(i)}
                className={`h-2 rounded-full transition-all ${
                  activePage === i ? "w-6 bg-[#29ABE2]" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
