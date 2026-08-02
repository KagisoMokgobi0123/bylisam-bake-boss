CREATE POLICY "muffin images public read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'muffin-images');

CREATE POLICY "muffin images admin write" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'muffin-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'muffin-images' AND public.has_role(auth.uid(), 'admin'));