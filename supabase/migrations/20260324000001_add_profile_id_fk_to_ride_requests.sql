-- Add profile_id column and foreign key constraint to ride_requests table
ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS profile_id UUID;

ALTER TABLE public.ride_requests
ADD CONSTRAINT fk_ride_requests_profile_id
FOREIGN KEY (profile_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
