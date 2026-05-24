import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StoreLayout from "@/components/StoreLayout";
import { blogPosts, blogCategories } from "@/data/blogPosts";

const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  const filtered = useMemo(() => {
    if (activeCategory === "Todas") return blogPosts;
    return blogPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <StoreLayout>
      <main className="container mx-auto px-4 py-8">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">
            Blog Gym
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Guias completos de suplementação, treino e saúde — atualizados em 2026.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {["Todas", ...blogCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors md:text-sm ${
                activeCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mb-4 text-center text-xs text-muted-foreground">
          {filtered.length} artigo{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="aspect-video w-full overflow-hidden bg-secondary">
                <img
                  src={post.cover}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="mb-2 self-start rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {post.category}
                </span>
                <h2 className="mb-2 line-clamp-2 text-base font-bold text-foreground group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span>
                  <span>{post.readMinutes} min de leitura</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </StoreLayout>
  );
};

export default BlogPage;
