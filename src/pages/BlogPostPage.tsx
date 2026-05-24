import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import StoreLayout from "@/components/StoreLayout";
import { blogPosts, getBlogPostBySlug } from "@/data/blogPosts";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  useEffect(() => {
    if (post?.metaTitle) document.title = post.metaTitle;
    else if (post?.title) document.title = post.title;
    return () => {
      document.title = "Ultra Gym";
    };
  }, [post]);

  if (!post) {
    return (
      <StoreLayout>
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Artigo não encontrado</h1>
          <Link to="/blog" className="mt-4 inline-block text-primary underline">
            Voltar ao blog
          </Link>
        </main>
      </StoreLayout>
    );
  }

  const related = blogPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  return (
    <StoreLayout>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Link to="/blog" className="mb-4 inline-block text-sm text-primary hover:underline">
          ← Todos os artigos
        </Link>

        <article>
          <header className="mb-6">
            <span className="mb-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {post.category}
            </span>
            <h1 className="text-2xl font-extrabold leading-tight text-foreground md:text-4xl">
              {post.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span>
              <span>•</span>
              <span>{post.readMinutes} min de leitura</span>
            </div>
          </header>

          <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-secondary">
            <img src={post.cover} alt={post.title} className="h-full w-full object-cover"  loading="lazy"/>
          </div>

          <div
            className="prose prose-sm max-w-none text-foreground prose-headings:font-bold prose-headings:text-foreground prose-h2:mt-8 prose-h2:text-2xl prose-h3:mt-6 prose-h3:text-xl prose-p:my-3 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground prose-ul:my-3 prose-li:my-1 md:prose-base"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.faq && post.faq.length > 0 && (
            <section className="mt-10 border-t border-border pt-6">
              <h2 className="mb-4 text-xl font-bold text-foreground">Perguntas frequentes</h2>
              <div className="space-y-4">
                {post.faq.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <h3 className="mb-2 text-sm font-bold text-foreground">{item.question}</h3>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {related.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="mb-4 text-lg font-bold text-foreground">Continue lendo</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-video w-full overflow-hidden bg-secondary">
                    <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary">
                      {p.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </StoreLayout>
  );
};

export default BlogPostPage;
