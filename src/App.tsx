import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Index from "./pages/Index";
import { CartProvider } from "./contexts/CartContext";
import CartDrawer from "./components/CartDrawer";

import PageLoader from "./components/PageLoader";
import OverridesGate from "./components/OverridesGate";

// Lazy import with auto-reload on stale chunk error (after redeploys)
const lazyWithRetry = <T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>
) =>
  lazy(async () => {
    const key = `lazy-retry:${factory.toString()}`;
    try {
      const mod = await factory();
      sessionStorage.removeItem(key);
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise<T>(() => {});
      }
      throw err;
    }
  });

// Lazy-loaded routes to keep the initial bundle light
const CategoryPage = lazyWithRetry(() => import("./pages/CategoryPage"));
const ProductPage = lazyWithRetry(() => import("./pages/ProductPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const CheckoutPage = lazyWithRetry(() => import("./pages/CheckoutPage"));
const SearchPage = lazyWithRetry(() => import("./pages/SearchPage"));
const PixPaymentPage = lazyWithRetry(() => import("./pages/PixPaymentPage"));
const UpsellTaxaEnvio = lazyWithRetry(() => import("./pages/UpsellTaxaEnvio"));
const UpsellDiferencaPedido = lazyWithRetry(() => import("./pages/UpsellDiferencaPedido"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminPanel = lazyWithRetry(() => import("./pages/AdminPanel"));
const AdminIpGate = lazyWithRetry(() => import("./components/AdminIpGate"));

const LegalPage = lazyWithRetry(() => import("./pages/LegalPage"));
const BlogPage = lazyWithRetry(() => import("./pages/BlogPage"));
const BlogPostPage = lazyWithRetry(() => import("./pages/BlogPostPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const LegacySearchRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/busca${search}`} replace />;
};

const LegacyProductRedirect = () => {
  const { slug } = useParams();
  const { search } = useLocation();

  if (!slug) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/produtos/${slug}${search}`} replace />;
};

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#29ABE2] border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <OverridesGate>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/collections/:category" element={<CategoryPage />} />
                <Route path="/produtos/:slug" element={<ProductPage />} />
                <Route path="/products/:slug" element={<LegacyProductRedirect />} />
                <Route path="/carrinho" element={<Navigate to="/checkout" replace />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/busca" element={<SearchPage />} />
                <Route path="/search" element={<LegacySearchRedirect />} />
                <Route path="/checkout/pix" element={<PixPaymentPage />} />
                <Route path="/upsell/taxa-envio" element={<UpsellTaxaEnvio />} />
                <Route path="/upsell/diferenca-pedido" element={<UpsellDiferencaPedido />} />
                <Route path="/admin/login" element={<AdminIpGate><AdminLogin /></AdminIpGate>} />
                <Route path="/paineladmin" element={<AdminIpGate><AdminPanel /></AdminIpGate>} />

                <Route path="/paginas/:slug" element={<LegalPage />} />
                <Route path="/fale-conosco" element={<LegalPage />} />
                <Route path="/paginas/contact" element={<Navigate to="/fale-conosco" replace />} />
                <Route path="/pages/politica-de-privacidade" element={<Navigate to="/paginas/privacy" replace />} />
                <Route path="/privacidade.html" element={<Navigate to="/paginas/privacy" replace />} />
                <Route path="/envio.html" element={<Navigate to="/paginas/shipping" replace />} />
                <Route path="/devolucao.html" element={<Navigate to="/paginas/returns" replace />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </OverridesGate>
          <CartDrawer />
          
          <PageLoader />
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
