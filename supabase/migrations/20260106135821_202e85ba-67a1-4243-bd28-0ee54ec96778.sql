-- Add email_verified column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Add email column to phone_verifications table (rename to verifications for general use)
-- Or create a separate email_verifications table
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verification attempts
CREATE POLICY "Users can view their own email verifications"
ON public.email_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own verification requests
CREATE POLICY "Users can create email verifications"
ON public.email_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications (for marking as verified)
CREATE POLICY "Users can update their own email verifications"
ON public.email_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_email_verifications_user_email ON public.email_verifications(user_id, email);
CREATE INDEX idx_email_verifications_code ON public.email_verifications(code, expires_at);