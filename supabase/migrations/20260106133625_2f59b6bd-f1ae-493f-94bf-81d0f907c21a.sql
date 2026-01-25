-- Create ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.ride_matches(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL,
  rated_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, rater_id)
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Users can create ratings for their matches
CREATE POLICY "Users can create ratings for their matches"
ON public.ratings
FOR INSERT
WITH CHECK (
  auth.uid() = rater_id
  AND EXISTS (
    SELECT 1 FROM ride_matches rm
    WHERE rm.id = ratings.match_id
    AND rm.status = 'accepted'
    AND (
      rm.requester_id = auth.uid()
      OR EXISTS (SELECT 1 FROM ride_requests rr WHERE rr.id = rm.ride_request_id AND rr.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM ride_requests rr WHERE rr.id = rm.matched_ride_id AND rr.user_id = auth.uid())
    )
  )
);

-- Users can view ratings they gave or received
CREATE POLICY "Users can view ratings"
ON public.ratings
FOR SELECT
USING (auth.uid() = rater_id OR auth.uid() = rated_user_id);

-- Create index for faster queries
CREATE INDEX idx_ratings_rated_user ON public.ratings(rated_user_id);
CREATE INDEX idx_ratings_match ON public.ratings(match_id);

-- Create function to update user's average rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  total_count INTEGER;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
  INTO avg_rating, total_count
  FROM ratings
  WHERE rated_user_id = NEW.rated_user_id;
  
  UPDATE profiles
  SET rating = avg_rating, total_rides = total_count
  WHERE user_id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update rating after insert
CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();