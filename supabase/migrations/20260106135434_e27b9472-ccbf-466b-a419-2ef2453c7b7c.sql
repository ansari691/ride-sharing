-- Create table to store OTP codes
CREATE TABLE public.phone_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification attempts
CREATE POLICY "Users can view their own verifications"
ON public.phone_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own verification requests
CREATE POLICY "Users can create verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications (for marking as verified)
CREATE POLICY "Users can update their own verifications"
ON public.phone_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_phone_verifications_user_phone ON public.phone_verifications(user_id, phone);
CREATE INDEX idx_phone_verifications_code ON public.phone_verifications(code, expires_at);