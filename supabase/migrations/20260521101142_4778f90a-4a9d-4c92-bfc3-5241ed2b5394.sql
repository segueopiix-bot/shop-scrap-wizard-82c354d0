-- 1) app_settings: remove public read, keep admin-only
DROP POLICY IF EXISTS "Settings readable by all" ON public.app_settings;

-- 2) orders: explicit deny on client-side writes (service role bypasses RLS)
CREATE POLICY "Only admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) payment-proofs bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

-- Replace permissive SELECT with admin-only
DROP POLICY IF EXISTS "Public can read proofs" ON storage.objects;

CREATE POLICY "Admins can read proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- INSERT stays open so anonymous customers can attach proof of payment.
-- (The existing "Public can upload proofs" policy is preserved.)