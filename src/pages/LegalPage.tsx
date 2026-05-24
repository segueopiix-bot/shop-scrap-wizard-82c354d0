import { useParams, Link, useLocation } from "react-router-dom";
import StoreLayout from "@/components/StoreLayout";
import ProductSection from "@/components/ProductSection";
import { legalPages } from "@/data/legalPages";
import { products } from "@/data/products";

const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const effectiveSlug = slug ?? (pathname === "/fale-conosco" ? "contact" : undefined);
  const page = effectiveSlug ? legalPages[effectiveSlug] : undefined;

  if (!page) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Voltar para a loja
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const vitrine = [...products].sort(() => Math.random() - 0.5).slice(0, 12);

  return (
    <StoreLayout>
      <main className="container-page py-8">
        <div className="max-w-3xl mx-auto">
        <article
          className="legal-prose"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
        </div>
      </main>
      <ProductSection
        title="Vitrine da Semana"
        subtitle="selecionados especialmente para você"
        products={vitrine}
        showViewAll={false}
      />


    </StoreLayout>
  );
};

export default LegalPage;