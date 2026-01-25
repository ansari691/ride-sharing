-- Create match status enum
CREATE TYPE public.match_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');

-- Create ride matches table
CREATE TABLE public.ride_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_request_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  matched_ride_id UUID NOT NULL REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  status public.match_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ride_request_id, matched_ride_id)
);

-- Enable RLS
ALTER TABLE public.ride_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches involving their rides
CREATE POLICY "Users can view their matches"
ON public.ride_matches
FOR SELECT
USING (
  auth.uid() = requester_id OR
  auth.uid() IN (
    SELECT user_id FROM public.ride_requests WHERE id = ride_request_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM public.ride_requests WHERE id = matched_ride_id
  )
);

-- Users can create match requests
CREATE POLICY "Users can create match requests"
ON public.ride_matches
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update matches they're involved in
CREATE POLICY "Users can update their matches"
ON public.ride_matches
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.ride_requests WHERE id = ride_request_id
  ) OR
  auth.uid() IN (
    SELECT user_id FROM public.ride_requests WHERE id = matched_ride_id
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_ride_matches_updated_at
BEFORE UPDATE ON public.ride_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_matches;