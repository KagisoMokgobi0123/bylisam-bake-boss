ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS residence text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS business_logo_url text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS business_slogan text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS opening_hours text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;