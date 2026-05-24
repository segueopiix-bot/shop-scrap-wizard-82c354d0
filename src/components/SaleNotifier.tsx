import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { products } from "@/data/products";

const NAMES = [
  "João", "Pedro", "Lucas", "Mateus", "Gabriel", "Rafael", "Bruno", "Felipe",
  "Thiago", "Diego", "Rodrigo", "Carlos", "André", "Marcos", "Vitor", "Gustavo",
  "Henrique", "Leonardo", "Eduardo", "Ricardo", "Fernando", "Anderson", "Igor",
  "Caio", "Murilo", "Otávio", "Renato", "Vinícius", "Daniel", "Alexandre",
  "Ana", "Mariana", "Juliana", "Camila", "Beatriz", "Larissa", "Carolina",
  "Patrícia", "Amanda", "Fernanda", "Bruna", "Letícia", "Natália", "Renata",
  "Vanessa", "Bianca", "Priscila", "Daniela", "Tatiana", "Débora",
];

// Major cities per state for variety. Falls back to visitor's own city.
const CITIES_BY_UF: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul"],
  AL: ["Maceió", "Arapiraca"],
  AP: ["Macapá", "Santana"],
  AM: ["Manaus", "Parintins"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari"],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte"],
  DF: ["Brasília", "Taguatinga", "Ceilândia"],
  ES: ["Vitória", "Vila Velha", "Serra"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis"],
  MA: ["São Luís", "Imperatriz"],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis"],
  MS: ["Campo Grande", "Dourados"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim"],
  PA: ["Belém", "Ananindeua", "Santarém"],
  PB: ["João Pessoa", "Campina Grande"],
  PR: ["Curitiba", "Londrina", "Maringá", "Cascavel"],
  PE: ["Recife", "Jaboatão", "Olinda", "Caruaru"],
  PI: ["Teresina", "Parnaíba"],
  RJ: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói"],
  RN: ["Natal", "Mossoró"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas"],
  RO: ["Porto Velho", "Ji-Paraná"],
  RR: ["Boa Vista"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "Chapecó"],
  SP: ["São Paulo", "Guarulhos", "Campinas", "Santo André", "São Bernardo", "Osasco", "Ribeirão Preto", "Sorocaba"],
  SE: ["Aracaju", "Nossa Senhora do Socorro"],
  TO: ["Palmas", "Araguaína"],
};

interface Notice {
  id: number;
  name: string;
  city: string;
  uf: string;
  productName: string;
  productImage: string;
  productSlug: string;
  minutesAgo: number;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const SaleNotifier = () => {
  const [location, setLocation] = useState<{ city: string; uf: string } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [counter, setCounter] = useState(0);

  // Fetch visitor location via IP geolocation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipwho.is/?fields=success,city,region_code,country_code");
        const data = await res.json();
        if (cancelled) return;
        if (data?.success && data.country_code === "BR" && data.region_code) {
          setLocation({ city: data.city || "São Paulo", uf: data.region_code });
          return;
        }
      } catch {
        // ignore
      }
      if (!cancelled) setLocation({ city: "São Paulo", uf: "SP" });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Schedule notifications.
  useEffect(() => {
    if (!location) return;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        const product = pick(products);
        const cities = CITIES_BY_UF[location.uf] || [location.city];
        // Bias toward visitor's own city
        const useOwn = Math.random() < 0.5;
        const city = useOwn ? location.city : pick(cities);
        setNotice({
          id: Date.now(),
          name: pick(NAMES),
          city,
          uf: location.uf,
          productName: product.name,
          productImage: product.image,
          productSlug: product.id,
          minutesAgo: 1 + Math.floor(Math.random() * 15),
        });
        setCounter((c) => c + 1);

        // Auto-dismiss after 6s
        const hide = setTimeout(() => setNotice(null), 6000);
        // Next notification 18-40s later
        schedule(18000 + Math.random() * 22000);
        return () => clearTimeout(hide);
      }, delay);
    };

    // First popup after 6-12s
    schedule(6000 + Math.random() * 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!notice) return null;

  return (
    <div
      key={counter}
      className="fixed bottom-4 left-4 z-[60] flex w-[300px] max-w-[92vw] animate-in slide-in-from-left-4 fade-in items-center gap-3 rounded-lg border border-border bg-white p-3 shadow-xl"
    >
      <a
        href={`/produtos/${notice.productSlug}`}
        className="flex flex-shrink-0 items-center justify-center"
      >
        <img
          src={notice.productImage}
          alt={notice.productName}
          className="h-14 w-14 rounded-md object-contain bg-white border border-border"
          loading="lazy"
        />
      </a>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[11px] text-green-700">
          <Check className="h-3 w-3" />
          <span className="font-semibold">Compra confirmada</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-foreground">
          <span className="font-semibold">{notice.name}</span> de {notice.city}/{notice.uf}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          comprou <span className="font-medium text-foreground">{notice.productName}</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          há {notice.minutesAgo} {notice.minutesAgo === 1 ? "minuto" : "minutos"}
        </p>
      </div>
      <button
        aria-label="Fechar"
        onClick={() => setNotice(null)}
        className="absolute right-1 top-1 rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default SaleNotifier;