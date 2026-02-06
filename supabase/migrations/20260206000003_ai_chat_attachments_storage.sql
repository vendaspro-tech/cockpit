-- Create storage bucket for AI chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-chat-attachments', 'ai-chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to manage attachments in this bucket
CREATE POLICY "AI Chat Attachments Select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ai-chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "AI Chat Attachments Insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'ai-chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "AI Chat Attachments Delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'ai-chat-attachments' AND auth.role() = 'authenticated');
