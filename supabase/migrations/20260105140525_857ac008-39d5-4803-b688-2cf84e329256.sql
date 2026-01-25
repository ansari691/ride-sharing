-- Create ride status enum
CREATE TYPE public.ride_status AS ENUM ('pending', 'matched', 'in_progress', 'completed', 'cancelled');

-- Create ride requests table
CREATE TABLE public.ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  seats_needed INTEGER NOT NULL DEFAULT 1,
  is_driver BOOLEAN NOT NULL DEFAULT false,
  seats_available INTEGER,
  status public.ride_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- Users can view all pending ride requests (for matching)
CREATE POLICY "Users can view pending ride requests"
ON public.ride_requests
FOR SELECT
USING (auth.uid() IS NOT NULL AND (status = 'pending' OR user_id = auth.uid()));

-- Users can create their own ride requests
CREATE POLICY "Users can create their own ride requests"
ON public.ride_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ride requests
CREATE POLICY "Users can update their own ride requests"
ON public.ride_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own ride requests
CREATE POLICY "Users can delete their own ride requests"
ON public.ride_requests
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_ride_requests_updated_at
BEFORE UPDATE ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();