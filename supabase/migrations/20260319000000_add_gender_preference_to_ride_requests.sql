-- Add gender preference field to ride_requests table
ALTER TABLE public.ride_requests
ADD COLUMN gender_preference public.gender_preference NOT NULL DEFAULT 'any';

CREATE INDEX idx_ride_requests_gender_preference
ON public.ride_requests(gender_preference);

COMMENT ON COLUMN public.ride_requests.gender_preference IS 'Preferred co-rider gender for this ride request';
