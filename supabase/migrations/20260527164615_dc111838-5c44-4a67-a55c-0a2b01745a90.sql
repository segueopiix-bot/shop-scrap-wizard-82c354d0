
CREATE TABLE public.logo_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.logo_tokens TO service_role;

ALTER TABLE public.logo_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_logo_tokens_token ON public.logo_tokens(token);
CREATE INDEX idx_logo_tokens_expires_at ON public.logo_tokens(expires_at);
