// Deterministic review system for products.
// - Total reviews: 23..10,000 (based on product id hash → "popularity")
// - Average rating: 4.5..5.0
// - Text reviews: deterministic pick from a pool of generic Portuguese reviews

export interface Review {
  name: string;
  rating: number; // 4 or 5
  date: string;   // e.g. "12/03/2025"
  title?: string;
  text: string;
}

const NAMES = [
  "Lucas M.", "Ana P.", "Rafael S.", "Juliana C.", "Pedro H.",
  "Mariana L.", "Felipe R.", "Camila T.", "Gabriel A.", "Beatriz F.",
  "Thiago O.", "Larissa V.", "Bruno D.", "Amanda S.", "Vinícius B.",
  "Carolina N.", "Eduardo G.", "Patrícia M.", "Diego F.", "Renata K.",
  "Marcos A.", "Fernanda L.", "Rodrigo P.", "Aline R.", "Gustavo C.",
  "Tatiana B.", "Henrique S.", "Vanessa M.", "Leandro T.", "Bianca O.",
  "Anderson J.", "Priscila D.", "Murilo F.", "Natália V.", "Otávio P.",
  "Daniela R.", "Caio M.", "Letícia A.", "Igor S.", "Sabrina C.",
  "Matheus L.", "Jéssica F.", "André B.", "Carla H.", "Rogério T.",
  "Débora N.", "Vitor H.", "Bruna G.", "Fábio R.", "Isabela M.",
];

const TEXTS: { title: string; text: string }[] = [
  { title: "Produto excelente!", text: "Chegou super rápido e bem embalado. Sabor ótimo e dilui muito bem. Já é minha terceira compra, recomendo!" },
  { title: "Custo benefício ótimo", text: "Pelo preço é imbatível. Qualidade muito boa, comparei com outras marcas mais caras e não fico devendo nada." },
  { title: "Recomendo demais", text: "Estou usando há algumas semanas e já sinto diferença nos treinos. Vou comprar novamente com certeza." },
  { title: "Entrega rápida", text: "Pedido chegou antes do prazo, embalagem intacta e produto lacrado. Atendimento da Growth nota 10." },
  { title: "Qualidade Growth", text: "Marca de confiança. Já uso há anos, nunca tive problema com nenhum lote. Sabor agradável e fácil de tomar." },
  { title: "Vale cada centavo", text: "Achei que pelo preço não seria tão bom, mas me surpreendeu. Sabor leve, não enjoa e rende bastante." },
  { title: "Comprei de novo", text: "Já é a quinta vez que peço. Sempre chega rápido e a qualidade nunca decepciona. Parabéns Growth!" },
  { title: "Sabor muito bom", text: "Sabor bem agradável, não fica enjoativo. Misturei com leite e ficou perfeito. Recomendo." },
  { title: "Resultado garantido", text: "Estou tendo ganhos visíveis usando o produto junto com treino e dieta. Vale muito a pena." },
  { title: "Ótimo!", text: "Produto de qualidade, embalagem reforçada e bem lacrado. Site sério, pode confiar." },
  { title: "Dilui muito bem", text: "Diferente de outros que ficam empedrados, esse dilui super fácil até na água. Recomendo!" },
  { title: "Atendimento top", text: "Tive uma dúvida e fui atendido rapidinho pelo suporte. Empresa séria e responsável." },
  { title: "Já é meu favorito", text: "Testei várias marcas e voltei para a Growth. Qualidade que se sente no resultado." },
  { title: "Chegou rapidinho", text: "Mora no interior e mesmo assim chegou em poucos dias. Produto perfeito, sem nada a reclamar." },
  { title: "Surpreendente", text: "Não esperava tanto pelo preço. Sabor bom, qualidade boa, entrega rápida. Vou pedir mais!" },
  { title: "Cumpre o que promete", text: "Fórmula de qualidade, fácil de tomar e estou vendo resultados nos meus treinos. Recomendo." },
  { title: "Show de bola", text: "Excelente custo benefício. Compro sempre direto no site da Growth, mais barato e mais seguro." },
  { title: "Embalagem caprichada", text: "Veio tudo certinho, bem lacrado e dentro do prazo. Produto de alta qualidade." },
  { title: "Recomendo a todos", text: "Indiquei para vários amigos da academia. Todos aprovaram. Growth não erra." },
  { title: "Excelente compra", text: "Pedido entregue antes do prazo, produto excelente e ainda com brinde. Muito satisfeito!" },
  { title: "Top demais", text: "Sabor maravilhoso, dilui rápido e o efeito no treino é nítido. Continuarei comprando." },
  { title: "Confiável", text: "Marca confiável, com selo de qualidade. Nunca tive problemas com nenhum produto deles." },
  { title: "Rende muito", text: "Achei que ia acabar rápido, mas está rendendo bem mais do que esperava. Vale o investimento." },
  { title: "Muito bom", text: "Produto de ótima procedência, registrado e seguro. Já recomendei pra galera da academia." },
  { title: "Ganhei no treino", text: "Senti diferença na energia e na recuperação. Estou bem satisfeito com o resultado." },
  { title: "Vale comprar", text: "Preço justo, qualidade superior. Não tem porque pagar mais caro em outras marcas." },
  { title: "Site confiável", text: "Primeira vez comprando aqui e fui muito bem atendido. Produto original e entregue rapidinho." },
  { title: "Sabor agradável", text: "Não tem aquele gosto químico de alguns suplementos. Bem suave e gostoso de tomar." },
  { title: "Aprovado", text: "Aprovadíssimo. Já é o terceiro pote e continuo gostando muito. Recomendo para iniciantes." },
  { title: "Muito satisfeito", text: "Compra tranquila, entrega rápida, produto ótimo. Não tenho nada a reclamar." },
  { title: "Resultado real", text: "Em poucas semanas já vi diferença. Combinado com treino sério faz toda a diferença." },
  { title: "Rapidíssimo", text: "Pedi de noite e em 3 dias estava na minha porta. Impressionante a logística da Growth." },
  { title: "Maravilhoso", text: "Simplesmente o melhor que já tomei. Sabor, qualidade e preço de outro nível." },
  { title: "Indico de olhos fechados", text: "Empresa séria, suplemento de qualidade e preço honesto. Não tem como reclamar." },
  { title: "Ótimo benefício", text: "Vi resultado bom em pouco tempo. Faz parte da minha rotina agora." },
  { title: "Compra certa", text: "Fiz a escolha certa. Produto de qualidade, marca de respeito no mercado." },
  { title: "Voltarei a comprar", text: "Com certeza voltarei a comprar. Sabor muito bom e tive bons ganhos." },
  { title: "Atende perfeitamente", text: "Atende exatamente o que eu precisava. Sem firulas, produto bom e direto ao ponto." },
  { title: "Sensacional", text: "Sensacional. Não há o que falar de ruim. Continuem com esse trabalho impecável." },
  { title: "Padrão Growth", text: "Padrão Growth de sempre: qualidade alta, entrega rápida e preço acessível." },
];

// Simple deterministic hash (djb2-ish).
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Mulberry32 PRNG seeded from product id.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ProductReviewStats {
  count: number;
  rating: number; // 4.5..5.0
}

export function getReviewStats(productId: string): ProductReviewStats {
  // Overrides for specific products
  if (productId === "multivitaminico-120") {
    return { count: 5000, rating: 4.9 };
  }

  const seed = hashStr(productId);
  const r = rng(seed);

  // Bias toward fewer reviews; some products are blockbusters.
  const tier = r();
  let count: number;
  if (tier < 0.35) count = 23 + Math.floor(r() * 180);           // 23..200
  else if (tier < 0.7) count = 200 + Math.floor(r() * 1000);     // 200..1200
  else if (tier < 0.92) count = 1200 + Math.floor(r() * 3800);   // 1200..5000
  else count = 5000 + Math.floor(r() * 5000);                    // 5000..10000

  // Rating in [4.5, 5.0], rounded to 0.1
  const rating = Math.round((4.5 + r() * 0.5) * 10) / 10;

  return { count, rating };
}

export function formatReviewCount(count: number): string {
  if (count >= 1000) {
    return `${Math.floor(count / 1000)} mil`;
  }
  return count.toLocaleString("pt-BR");
}

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function getReviews(productId: string, limit: number): Review[] {
  const seed = hashStr(productId + ":reviews");
  const r = rng(seed);
  const out: Review[] = [];
  const usedTexts = new Set<number>();
  const usedNames = new Set<number>();
  let lastDays = 1 + Math.floor(r() * 4);

  for (let i = 0; i < limit; i++) {
    let tIdx = Math.floor(r() * TEXTS.length);
    let guard = 0;
    while (usedTexts.has(tIdx) && guard++ < 50) tIdx = Math.floor(r() * TEXTS.length);
    usedTexts.add(tIdx);

    let nIdx = Math.floor(r() * NAMES.length);
    let g2 = 0;
    while (usedNames.has(nIdx) && g2++ < 50) nIdx = Math.floor(r() * NAMES.length);
    usedNames.add(nIdx);

    // 85% 5-star, 15% 4-star
    const rating = r() < 0.85 ? 5 : 4;
    lastDays += 1 + Math.floor(r() * 10);

    out.push({
      name: NAMES[nIdx],
      rating,
      date: formatDate(lastDays),
      title: TEXTS[tIdx].title,
      text: TEXTS[tIdx].text,
    });
  }
  return out;
}