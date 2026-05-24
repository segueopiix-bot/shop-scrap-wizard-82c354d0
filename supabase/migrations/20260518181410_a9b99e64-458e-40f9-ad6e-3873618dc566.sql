
DROP POLICY IF EXISTS "Public can attach proof to order" ON public.orders;

CREATE OR REPLACE FUNCTION public.attach_payment_proof(_transaction_id text, _proof_url text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.orders
  SET proof_url = _proof_url, updated_at = now()
  WHERE transaction_id = _transaction_id;
$$;

REVOKE ALL ON FUNCTION public.attach_payment_proof(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.attach_payment_proof(text, text) TO anon, authenticated;
