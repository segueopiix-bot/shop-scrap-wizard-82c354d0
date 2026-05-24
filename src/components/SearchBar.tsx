import { Search, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { products } from "@/data/products";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

const SearchBar = ({ placeholder = "O que você está procurando?", className = "" }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/busca?q=${encodeURIComponent(q)}`);
  };

  const formatBRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={submit} className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          className="w-full rounded-lg bg-[#F4F4F4] pl-5 pr-14 py-3 text-sm text-foreground placeholder:text-gray-400 focus:outline-none border-none shadow-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Limpar"
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <Search className="h-5 w-5" />
        </button>

      </form>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[70vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-100">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhum produto encontrado.</div>
          ) : (
            <>
              <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[#29ABE2]">
                Produtos
              </div>
              <ul>
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/products/${p.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                    >
                      <img src={p.image} alt={p.name} className="h-12 w-12 object-contain flex-shrink-0"  loading="lazy"/>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-gray-800">{p.name}</div>
                        <div className="text-sm font-bold text-[#29ABE2]">{formatBRL(p.price)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={submit as any}
                className="block w-full border-t border-gray-100 px-4 py-3 text-center text-sm font-semibold text-[#29ABE2] hover:bg-gray-50"
              >
                Ver todos os resultados para "{query}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
