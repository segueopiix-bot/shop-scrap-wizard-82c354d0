import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, X, Home, ShoppingBag, BookOpen, Phone, MessageCircle, Mail, HelpCircle, ShieldCheck, User } from "lucide-react";

type SubItem = {
  label: string;
  path: string;
  children?: { label: string; path: string }[];
};

type NavItem = {
  label: string;
  path: string;
  children?: SubItem[];
};

const supplementSubcategories: SubItem[] = [
  { label: "Queima de Estoque", path: "/collections/queima-de-estoque" },
  { label: "Whey Protein", path: "/collections/whey-protein" },
  { label: "Creatina", path: "/collections/creatina" },
  { label: "Pre Treino", path: "/collections/pre-treino" },
  { label: "Pasta de Amendoim", path: "/collections/pasta-de-amendoim" },
  { label: "Vitaminas", path: "/collections/vitaminas" },
  { label: "Vestuario", path: "/collections/vestuario" },
  { label: "Comestiveis", path: "/collections/comestiveis" },
  { label: "Kits", path: "/collections/kits" },
  { label: "Barrinhas", path: "/collections/barrinhas" },
];

const cosmeticosSubcategories: SubItem[] = [
  {
    label: "Cabelos",
    path: "/collections/cosmeticos-cabelos",
    children: [
      { label: "Ativador de cachos", path: "/collections/cosmeticos-cabelos-ativador-de-cachos" },
      { label: "Bálsamo e Creme", path: "/collections/cosmeticos-cabelos-balsamo-e-creme" },
      { label: "Cacheado e crespo", path: "/collections/cosmeticos-cabelos-cacheado-e-crespo" },
      { label: "Coloridos e com mechas", path: "/collections/cosmeticos-cabelos-coloridos-e-com-mechas" },
      { label: "Danificados", path: "/collections/cosmeticos-cabelos-danificados" },
      { label: "Fino", path: "/collections/cosmeticos-cabelos-fino" },
      { label: "Kits para Cabelos", path: "/collections/cosmeticos-cabelos-kits-para-cabelos" },
      { label: "Loiros e descoloridos", path: "/collections/cosmeticos-cabelos-loiros-e-descoloridos" },
      { label: "Normal ou todos os tipos", path: "/collections/cosmeticos-cabelos-normal-ou-todos-os-tipos" },
      { label: "Óleo", path: "/collections/cosmeticos-cabelos-oleo" },
      { label: "Protetor Térmico", path: "/collections/cosmeticos-cabelos-protetor-termico" },
      { label: "Seco e ressecados", path: "/collections/cosmeticos-cabelos-seco-e-ressecados" },
      { label: "Tratamentos e Máscaras", path: "/collections/cosmeticos-cabelos-tratamentos-e-mascaras" },
    ],
  },
  {
    label: "Cuidados Pessoais",
    path: "/collections/cosmeticos-cuidados-pessoais",
    children: [
      { label: "Sabonetes", path: "/collections/cosmeticos-cuidados-pessoais-sabonetes" },
    ],
  },
  {
    label: "Dermocosméticos",
    path: "/collections/cosmeticos-dermocosmeticos",
    children: [
      { label: "Água Micelar", path: "/collections/cosmeticos-dermocosmeticos-agua-micelar" },
      { label: "Anti-Marcas", path: "/collections/cosmeticos-dermocosmeticos-anti-marcas" },
      { label: "Cuidados Corporais Específicos", path: "/collections/cosmeticos-dermocosmeticos-cuidados-corporais-especificos" },
      { label: "Cuidados Faciais Específicos", path: "/collections/cosmeticos-dermocosmeticos-cuidados-faciais-especificos" },
      { label: "Face", path: "/collections/cosmeticos-dermocosmeticos-face" },
      { label: "Gel de Limpeza", path: "/collections/cosmeticos-dermocosmeticos-gel-de-limpeza" },
      { label: "Hidratantes", path: "/collections/cosmeticos-dermocosmeticos-hidratantes" },
      { label: "Hidratantes Corporais", path: "/collections/cosmeticos-dermocosmeticos-hidratantes-corporais" },
      { label: "Kits", path: "/collections/cosmeticos-dermocosmeticos-kits" },
      { label: "Limpadores", path: "/collections/cosmeticos-dermocosmeticos-limpadores" },
      { label: "Protetor Solar", path: "/collections/cosmeticos-dermocosmeticos-protetor-solar" },
      { label: "Protetor Solar Com Cor", path: "/collections/cosmeticos-dermocosmeticos-protetor-solar-com-cor" },
      { label: "Rejuvenescedores", path: "/collections/cosmeticos-dermocosmeticos-rejuvenescedores" },
      { label: "Shampoo", path: "/collections/cosmeticos-dermocosmeticos-shampoo" },
      { label: "Tônicos", path: "/collections/cosmeticos-dermocosmeticos-tonicos" },
      { label: "Tratamentos", path: "/collections/cosmeticos-dermocosmeticos-tratamentos" },
    ],
  },
  {
    label: "Maquiagem",
    path: "/collections/cosmeticos-maquiagem",
    children: [
      { label: "Acessórios de Remoção da Maquiagem", path: "/collections/cosmeticos-maquiagem-acessorios-de-remocao-da-maquiagem" },
      { label: "Base", path: "/collections/cosmeticos-maquiagem-base" },
      { label: "Batom", path: "/collections/cosmeticos-maquiagem-batom" },
      { label: "Blush", path: "/collections/cosmeticos-maquiagem-blush" },
      { label: "Contorno", path: "/collections/cosmeticos-maquiagem-contorno" },
      { label: "Contorno Labial", path: "/collections/cosmeticos-maquiagem-contorno-labial" },
      { label: "Corretivo", path: "/collections/cosmeticos-maquiagem-corretivo" },
      { label: "Demaquilante", path: "/collections/cosmeticos-maquiagem-demaquilante" },
      { label: "Esponja", path: "/collections/cosmeticos-maquiagem-esponja" },
      { label: "Estojo Completo ou Kit de Maquiagem", path: "/collections/cosmeticos-maquiagem-estojo-completo-ou-kit-de-maquiagem" },
      { label: "Fixador da Maquiagem", path: "/collections/cosmeticos-maquiagem-fixador-da-maquiagem" },
      { label: "Gloss", path: "/collections/cosmeticos-maquiagem-gloss" },
      { label: "Lápis e Kajal", path: "/collections/cosmeticos-maquiagem-lapis-e-kajal" },
      { label: "Máscara para Cílios", path: "/collections/cosmeticos-maquiagem-mascara-para-cilios" },
      { label: "Máscara para Sobrancelhas", path: "/collections/cosmeticos-maquiagem-mascara-para-sobrancelhas" },
      { label: "Pó Compacto", path: "/collections/cosmeticos-maquiagem-po-compacto" },
      { label: "Pó Facial", path: "/collections/cosmeticos-maquiagem-po-facial" },
      { label: "Sombra", path: "/collections/cosmeticos-maquiagem-sombra" },
    ],
  },
  {
    label: "Mundo Época",
    path: "/collections/cosmeticos-mundo-epoca",
    children: [
      { label: "Mundo Época", path: "/collections/cosmeticos-mundo-epoca-mundo-epoca" },
    ],
  },
  {
    label: "Perfumes",
    path: "/collections/cosmeticos-perfumes",
    children: [
      { label: "Perfume Feminino", path: "/collections/cosmeticos-perfumes-perfume-feminino" },
      { label: "Perfume Masculino", path: "/collections/cosmeticos-perfumes-perfume-masculino" },
      { label: "Perfume para o Corpo", path: "/collections/cosmeticos-perfumes-perfume-para-o-corpo" },
    ],
  },
  {
    label: "Tratamentos",
    path: "/collections/cosmeticos-tratamentos",
    children: [
      { label: "Água Micelar", path: "/collections/cosmeticos-tratamentos-agua-micelar" },
      { label: "Cuidados Faciais Específicos", path: "/collections/cosmeticos-tratamentos-cuidados-faciais-especificos" },
      { label: "Hidratantes Faciais", path: "/collections/cosmeticos-tratamentos-hidratantes-faciais" },
      { label: "Limpadores Faciais", path: "/collections/cosmeticos-tratamentos-limpadores-faciais" },
      { label: "Protetor Solar", path: "/collections/cosmeticos-tratamentos-protetor-solar" },
      { label: "Protetor Solar com Cor", path: "/collections/cosmeticos-tratamentos-protetor-solar-com-cor" },
    ],
  },
];

const navItems: NavItem[] = [
  { label: "Início", path: "/" },
  { label: "Cosméticos", path: "/collections/cosmeticos", children: cosmeticosSubcategories },
  { label: "Blog", path: "/blog" },
];

interface NavigationProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const Navigation = ({ mobileOpen, onClose }: NavigationProps) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <nav className="border-b border-nav-border bg-nav">
      {/* Desktop */}
      <div className="container-page hidden items-center justify-center gap-1 py-3 md:flex">
        {navItems.map((item) =>
          item.children ? (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                className={`flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                  location.pathname === item.path ? "text-primary font-bold" : "text-nav-foreground"
                }`}
              >
                {item.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              <div className="absolute left-0 top-full z-50 hidden min-w-[220px] rounded-md border border-border bg-card shadow-lg group-hover:block">
                {item.children.map((child) => (
                  <div key={child.path} className="relative group/sub">
                    <Link
                      to={child.path}
                      className={`flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-secondary ${
                        location.pathname === child.path
                          ? "text-primary font-bold"
                          : "text-foreground"
                      }`}
                    >
                      <span>{child.label}</span>
                      {child.children && <ChevronRight className="h-3.5 w-3.5" />}
                    </Link>
                    {child.children && (
                      <div className="absolute left-full top-0 z-50 hidden min-w-[200px] rounded-md border border-border bg-card shadow-lg group-hover/sub:block">
                        {child.children.map((leaf) => (
                          <Link
                            key={leaf.path}
                            to={leaf.path}
                            className={`block px-4 py-2 text-sm transition-colors hover:bg-secondary ${
                              location.pathname === leaf.path
                                ? "text-primary font-bold"
                                : "text-foreground"
                            }`}
                          >
                            {leaf.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                location.pathname === item.path
                  ? "text-primary font-bold"
                  : "text-nav-foreground"
              }`}
            >
              {item.label}
            </Link>
          )
        )}
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-white shadow-2xl md:hidden flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bem-vindo(a)</p>
                  <p className="text-sm font-bold text-foreground">Minha Conta</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Fechar menu">
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>
            
            <div className="flex-1 py-4 overflow-y-auto">
              <div className="px-4 mb-6">
                <p className="px-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Navegação</p>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.label === "Início" ? Home : item.label === "Cosméticos" ? ShoppingBag : BookOpen;
                    return item.children ? (
                      <div key={item.path} className="border-b border-gray-50 last:border-0">
                        <button
                          onClick={() => setOpenMenu((v) => (v === item.path ? null : item.path))}
                          className={`flex w-full items-center justify-between px-3 py-4 text-sm font-semibold transition-colors rounded-lg hover:bg-gray-50 ${
                            location.pathname === item.path
                              ? "text-primary bg-primary/5"
                              : "text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${location.pathname === item.path ? "text-primary" : "text-gray-400"}`} />
                            {item.label}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-300 ${openMenu === item.path ? "rotate-180" : ""}`}
                          />
                        </button>
                        {openMenu === item.path && (
                          <div className="bg-gray-50/50 rounded-lg mx-2 my-1 overflow-hidden">
                            {item.children.map((child) => (
                              <div key={child.path} className="border-b border-gray-100/50 last:border-0">
                                <Link
                                  to={child.path}
                                  className={`flex items-center justify-between px-6 py-3.5 text-sm transition-colors hover:bg-white ${
                                    location.pathname === child.path
                                      ? "text-primary font-bold"
                                      : "text-gray-700"
                                  }`}
                                  onClick={onClose}
                                >
                                  {child.label}
                                  {child.children && <ChevronRight className="h-3 w-3 opacity-50" />}
                                </Link>
                                {child.children?.map((leaf) => (
                                  <Link
                                    key={leaf.path}
                                    to={leaf.path}
                                    className={`block px-10 py-2.5 text-xs transition-colors hover:bg-white border-l-2 ml-6 ${
                                      location.pathname === leaf.path
                                        ? "text-primary font-bold border-primary"
                                        : "text-muted-foreground border-transparent"
                                    }`}
                                    onClick={onClose}
                                  >
                                    {leaf.label}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-4 text-sm font-semibold transition-colors rounded-lg hover:bg-gray-50 ${
                          location.pathname === item.path
                            ? "text-primary bg-primary/5"
                            : "text-foreground"
                        }`}
                        onClick={onClose}
                      >
                        <Icon className={`h-5 w-5 ${location.pathname === item.path ? "text-primary" : "text-gray-400"}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 mb-6">
                <p className="px-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Suporte & Contato</p>
                <div className="space-y-1">
                  <a href="https://wa.me/5511998397447" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:bg-gray-50" onClick={onClose}>
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    WhatsApp
                  </a>
                  <a href="tel:+5511998397447" className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:bg-gray-50" onClick={onClose}>
                    <Phone className="h-5 w-5 text-blue-500" />
                    Ligar agora
                  </a>
                  <Link to="/fale-conosco" className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:bg-gray-50" onClick={onClose}>
                    <Mail className="h-5 w-5 text-orange-500" />
                    E-mail
                  </a>
                  <Link to="/paginas/faq" className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:bg-gray-50" onClick={onClose}>
                    <HelpCircle className="h-5 w-5 text-purple-500" />
                    Dúvidas Frequentes
                  </Link>
                </div>
              </div>

              <div className="px-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Compra 100% Segura</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Seus dados estão protegidos com criptografia de ponta a ponta.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/30 text-center">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                Tendência Cosméticos © 2026
              </p>
            </div>
          </div>
                  </Link>
                </div>
              </div>

              <div className="px-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Compra 100% Segura</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Seus dados estão protegidos com criptografia de ponta a ponta.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/30">
              <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-widest">
                Tendência Cosméticos © 2026
              </p>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navigation;
