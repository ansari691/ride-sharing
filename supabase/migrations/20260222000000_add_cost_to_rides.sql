-- Add total_cost field to ride_requests table
ALTER TABLE public.ride_requests ADD COLUMN total_cost DECIMAL(10, 2);

-- Create index for cost-related queries
CREATE INDEX idx_ride_requests_cost ON public.ride_requests(total_cost);

-- Add comment explaining the field
COMMENT ON COLUMN public.ride_requests.total_cost IS 'Total cost of the ride to be split among passengers';
