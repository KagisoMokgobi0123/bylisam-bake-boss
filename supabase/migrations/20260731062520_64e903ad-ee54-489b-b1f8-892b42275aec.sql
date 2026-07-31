ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_reference text,
  customer_name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews public read approved" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "reviews read own or admin" ON public.reviews
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews insert own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_approved = false);
CREATE POLICY "reviews admin write" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.production_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_costs TO authenticated;
GRANT ALL ON public.production_costs TO service_role;

ALTER TABLE public.production_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production costs admin only" ON public.production_costs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER production_costs_set_updated_at BEFORE UPDATE ON public.production_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.production_settings (
  id boolean PRIMARY KEY DEFAULT true,
  batch_yield integer NOT NULL DEFAULT 12,
  selling_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_settings_single CHECK (id)
);

GRANT SELECT, INSERT, UPDATE ON public.production_settings TO authenticated;
GRANT ALL ON public.production_settings TO service_role;

ALTER TABLE public.production_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production settings admin only" ON public.production_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER production_settings_set_updated_at BEFORE UPDATE ON public.production_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.production_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated, anon, public;