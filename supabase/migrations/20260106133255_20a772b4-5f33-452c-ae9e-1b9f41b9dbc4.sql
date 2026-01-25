-- Create SOS alerts table to log emergency alerts
CREATE TABLE public.sos_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  match_id UUID REFERENCES public.ride_matches(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  location_address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- Users can create their own SOS alerts
CREATE POLICY "Users can create their own SOS alerts"
ON public.sos_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own SOS alerts
CREATE POLICY "Users can view their own SOS alerts"
ON public.sos_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own SOS alerts (to resolve them)
CREATE POLICY "Users can update their own SOS alerts"
ON public.sos_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_sos_alerts_user_id ON public.sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_status ON public.sos_alerts(status);