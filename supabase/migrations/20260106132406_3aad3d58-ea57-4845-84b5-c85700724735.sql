-- Create messages table for chat between matched riders
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.ride_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their matches
CREATE POLICY "Users can view messages for their matches"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ride_matches rm
    WHERE rm.id = messages.match_id
    AND (
      rm.requester_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM ride_requests rr
        WHERE rr.id = rm.ride_request_id AND rr.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM ride_requests rr
        WHERE rr.id = rm.matched_ride_id AND rr.user_id = auth.uid()
      )
    )
  )
);

-- Users can send messages to their matches
CREATE POLICY "Users can send messages to their matches"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM ride_matches rm
    WHERE rm.id = messages.match_id
    AND rm.status = 'accepted'
    AND (
      rm.requester_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM ride_requests rr
        WHERE rr.id = rm.ride_request_id AND rr.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM ride_requests rr
        WHERE rr.id = rm.matched_ride_id AND rr.user_id = auth.uid()
      )
    )
  )
);

-- Users can update read_at for messages in their matches
CREATE POLICY "Users can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM ride_matches rm
    WHERE rm.id = messages.match_id
    AND (
      rm.requester_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM ride_requests rr
        WHERE rr.id = rm.ride_request_id AND rr.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM ride_requests rr
        WHERE rr.id = rm.matched_ride_id AND rr.user_id = auth.uid()
      )
    )
  )
);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create index for faster queries
CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);