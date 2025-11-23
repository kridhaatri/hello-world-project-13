-- Create theme_config table for theme customization
CREATE TABLE public.theme_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read theme config
CREATE POLICY "Anyone can view theme config"
ON public.theme_config
FOR SELECT
USING (true);

-- Only admins can modify theme config
CREATE POLICY "Admins can modify theme config"
ON public.theme_config
FOR ALL
USING (public.has_role('admin'::app_role, auth.uid()));

-- Insert default theme colors
INSERT INTO public.theme_config (config_key, config_value) VALUES
  ('primary_color', '222.2 47.4% 11.2%'),
  ('primary_foreground', '210 40% 98%'),
  ('secondary_color', '210 40% 96.1%'),
  ('secondary_foreground', '222.2 47.4% 11.2%'),
  ('accent_color', '210 40% 96.1%'),
  ('accent_foreground', '222.2 47.4% 11.2%'),
  ('background_color', '0 0% 100%'),
  ('foreground_color', '222.2 84% 4.9%');