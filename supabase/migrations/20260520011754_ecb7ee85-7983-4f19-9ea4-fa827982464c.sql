
-- Product price overrides (over the static catalog)
CREATE TABLE public.product_overrides (
  product_id text PRIMARY KEY,
  price numeric(10,2),
  original_price numeric(10,2),
  installment text,
  discount integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Overrides readable by all"
ON public.product_overrides FOR SELECT USING (true);

CREATE POLICY "Admins manage overrides"
ON public.product_overrides FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_product_overrides_updated
BEFORE UPDATE ON public.product_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Variant price overrides
CREATE TABLE public.variant_price_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  variant_key text NOT NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant_key)
);

ALTER TABLE public.variant_price_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variant overrides readable by all"
ON public.variant_price_overrides FOR SELECT USING (true);

CREATE POLICY "Admins manage variant overrides"
ON public.variant_price_overrides FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_variant_overrides_product ON public.variant_price_overrides(product_id);

CREATE TRIGGER trg_variant_overrides_updated
BEFORE UPDATE ON public.variant_price_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Custom (admin-added) products
CREATE TABLE public.custom_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  installment text,
  discount integer,
  image text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  variant_prices jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom products readable by all"
ON public.custom_products FOR SELECT USING (true);

CREATE POLICY "Admins manage custom products"
ON public.custom_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_custom_products_updated
BEFORE UPDATE ON public.custom_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
