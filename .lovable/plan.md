## Objetivo
Permitir que o admin (em `/paineladmin`) gerencie preços de produtos e variantes, além de adicionar novos produtos, sem precisar editar arquivos de código.

## Abordagem

Como o catálogo hoje é 100% estático (`src/data/products.ts` + `src/data/productDescriptions.ts`), criaremos uma camada de **overrides no banco** que são aplicados em runtime sobre o catálogo estático. Assim nada quebra e o admin ganha controle total.

### 1. Banco de dados (Lovable Cloud)

Duas novas tabelas:

- **`product_overrides`** — sobrescreve preço/installment/desconto de um produto existente
  - `product_id` (texto, PK) — slug do produto
  - `price`, `original_price` (numeric, opcionais)
  - `installment` (texto, opcional)
  - `discount` (int, opcional)
  - `active` (bool)

- **`variant_price_overrides`** — sobrescreve preço por variante
  - `id` (uuid PK)
  - `product_id` (texto)
  - `variant_key` (texto, ex.: "500ml", "100ml")
  - `price`, `original_price` (numeric)
  - UNIQUE(product_id, variant_key)

- **`custom_products`** — produtos adicionados pelo admin
  - `id` (texto PK = slug), `name`, `category`, `price`, `original_price`, `installment`, `discount`, `image`, `images` (jsonb), `description` (text), `variant_prices` (jsonb), `active` (bool)

**RLS:** leitura pública (`SELECT true`); escrita apenas para `has_role(admin)`.

### 2. Aplicação dos overrides no frontend

Criar `src/hooks/useProductOverrides.ts`:
- Busca todos os overrides + custom_products uma vez (React Query, cache).
- Expõe `applyOverrides(product)` e `getAllProducts()` que mescla estático + custom + overrides.

Refatorar pontos que leem `products` / `productDescriptions`:
- `src/pages/ProductPage.tsx` — aplica override no produto e nos `variantPrices`.
- `src/pages/CategoryPage.tsx`, `Index.tsx`, `SearchPage.tsx`, `ProductSection.tsx`, `ProductCard.tsx` (onde lista preço) — usar hook para preços atualizados.

### 3. Painel admin (`src/pages/AdminPanel.tsx`)

Adicionar nova aba **"Produtos"** com:

- **Buscar produto** (input com filtro por nome) — lista resultados paginados (20 por vez).
- Cada linha mostra: imagem, nome, categoria, preço atual (com override aplicado), botão **Editar**.
- **Modal de edição**:
  - Campos: preço, preço original, parcelamento, desconto %.
  - Seção **Variantes** (se o produto tem `variantPrices`): lista cada variante com inputs de preço e preço original.
  - Botão **Salvar** → upsert em `product_overrides` e `variant_price_overrides`.
  - Botão **Resetar** → remove overrides (volta ao valor do código).
- Botão **+ Adicionar produto** → modal com formulário (nome, slug, categoria, preço, imagem URL, descrição, variantes opcionais) → insere em `custom_products`.
- Linha de cada custom_product tem também botão **Excluir**.

### 4. Detalhes técnicos

- Preços guardados em `numeric(10,2)` reais (não centavos), seguindo padrão atual do código.
- `installment` recalculado automaticamente como `price/12` quando o admin não preenche.
- Slugs de custom_products são validados (lowercase, sem espaços) e única.
- Sem mexer em pagamento/checkout — o carrinho já lê `product.price` então herda automaticamente.

### Arquivos a criar/editar
- **Migração SQL** — 3 tabelas + policies.
- **`src/hooks/useProductOverrides.ts`** — novo.
- **`src/pages/AdminPanel.tsx`** — nova aba "Produtos".
- **`src/components/admin/ProductEditor.tsx`** — modal edição (novo).
- **`src/components/admin/AddProductDialog.tsx`** — modal criação (novo).
- **`src/pages/ProductPage.tsx`** — aplicar overrides.
- **`src/components/ProductCard.tsx`** — aplicar overrides ao listar.
- **`src/pages/CategoryPage.tsx`, `Index.tsx`, `SearchPage.tsx`** — incluir custom_products na listagem e aplicar overrides.

Posso prosseguir?