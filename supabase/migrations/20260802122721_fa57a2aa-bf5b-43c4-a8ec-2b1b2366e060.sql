ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.muffins ADD COLUMN IF NOT EXISTS points_value integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reward_transactions TO authenticated;
GRANT ALL ON public.reward_transactions TO service_role;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward transactions read own or admin" ON public.reward_transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reward transactions admin write" ON public.reward_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS reward_transactions_user_idx ON public.reward_transactions (user_id, created_at DESC);