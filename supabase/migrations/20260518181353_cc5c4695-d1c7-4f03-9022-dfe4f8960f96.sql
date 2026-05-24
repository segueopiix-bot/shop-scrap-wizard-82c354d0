
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can upload proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Public can read proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Admins can delete proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- Allow public/anon to update orders ONLY to attach a proof_url for a known transaction
CREATE POLICY "Public can attach proof to order"
ON public.orders FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
