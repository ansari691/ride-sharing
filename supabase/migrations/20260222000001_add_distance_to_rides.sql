-- Add distance field to ride_requests table
ALTER TABLE public.ride_requests ADD COLUMN distance DECIMAL(10, 2);

-- Create index for distance-related queries
CREATE INDEX idx_ride_requests_distance ON public.ride_requests(distance);

-- Add comment explaining the field
COMMENT ON COLUMN public.ride_requests.distance IS 'Distance of the ride in kilometers (from Mapbox routing API)';
