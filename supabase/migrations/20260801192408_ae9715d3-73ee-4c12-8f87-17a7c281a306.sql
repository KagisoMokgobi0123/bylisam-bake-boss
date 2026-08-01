ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS business_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS business_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cashier_name text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric;

CREATE TABLE IF NOT EXISTS public.feedback_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_rate_limits_key_idx ON public.feedback_rate_limits (client_key, created_at DESC);
GRANT ALL ON public.feedback_rate_limits TO service_role;
ALTER TABLE public.feedback_rate_limits ENABLE ROW LEVEL SECURITY;