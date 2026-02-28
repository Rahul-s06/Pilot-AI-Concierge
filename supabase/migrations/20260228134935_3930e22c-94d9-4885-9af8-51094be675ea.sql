
CREATE TABLE public.pilots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public access, no auth needed
ALTER TABLE public.pilots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pilots" ON public.pilots FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pilots" ON public.pilots FOR INSERT WITH CHECK (true);
