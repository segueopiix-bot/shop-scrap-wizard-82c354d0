// Cidades atendidas pela entrega expressa Drogal
const RAW_CITIES = [
  "Americana", "Amparo", "Angatuba", "Araçatuba", "Araraquara", "Araras",
  "Artur Nogueira", "Atibaia", "Avaré", "Bariri", "Barretos", "Bauru",
  "Bebedouro", "Boituva", "Botucatu", "Bragança Paulista", "Brotas",
  "Cabreúva", "Caçapava", "Cajuru", "Campinas", "Capivari", "Casa Branca",
  "Catanduva", "Cerqueira César", "Cerquilho", "Cesário Lange", "Charqueada",
  "Conchas", "Cordeirópolis", "Cosmópolis", "Cravinhos", "Descalvado",
  "Dois Córregos", "Elias Fausto", "Espírito Santo do Pinhal", "Franca",
  "Garça", "Guariba", "Holambra", "Hortolândia", "Ibaté", "Ibitinga",
  "Indaiatuba", "Iracemápolis", "Itapetininga", "Itapeva", "Itatiba",
  "Itatinga", "Itu", "Itupeva", "Jaboticabal", "Jaguariúna", "Jaú",
  "Jundiaí", "Leme", "Lençóis Paulista", "Limeira", "Lins", "Louveira",
  "Macatuba", "Matão", "Mococa", "Mogi Guaçu", "Mogi Mirim", "Monte Alto",
  "Monte Azul Paulista", "Monte Mor", "Monte Sião", "Nova Odessa", "Olímpia",
  "Orlândia", "Paulínia", "Pedreira", "Piedade", "Pilar do Sul", "Piracicaba",
  "Pirajuí", "Pirassununga", "Pitangueiras", "Porto Ferreira", "Rafard",
  "Ribeirão Preto", "Rio Claro", "Rio das Pedras", "Saltinho", "Salto",
  "Santa Bárbara d'Oeste", "Santa Cruz das Palmeiras", "Santa Gertrudes",
  "Santa Rita do Passa Quatro", "Santo Antônio de Posse", "São Carlos",
  "São João da Boa Vista", "São Joaquim da Barra", "São José do Rio Pardo",
  "São Manuel", "São Pedro", "São Simão", "Serra Negra", "Serrana",
  "Sertãozinho", "Severínia", "Socorro", "Sorocaba", "Sumaré", "Taquaritinga",
  "Taquarituba", "Tietê", "Tupã", "Valinhos", "Vinhedo", "Votorantim",
];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .toLowerCase()
    .trim();

const DROGAL_CITIES = new Set(RAW_CITIES.map(normalize));

export function isDrogalCity(city: string): boolean {
  if (!city) return false;
  return DROGAL_CITIES.has(normalize(city));
}
