-- Add foreign key constraint for user_id in ride_requests table
ALTER TABLE public.ride_requests
ADD CONSTRAINT fk_ride_requests_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
