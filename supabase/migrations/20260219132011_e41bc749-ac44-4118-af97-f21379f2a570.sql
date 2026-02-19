
-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  524288000, -- 500MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Admins can upload and manage all project files
CREATE POLICY "Admins can manage project files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Clients can view (download) their own project files when content is unlocked
CREATE POLICY "Clients can download unlocked project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.client_user_id = auth.uid()
      AND p.content_locked = false
      AND (storage.foldername(name))[1] = p.id::text
  )
);

-- Clients can view preview files regardless of lock state (first folder segment = project id, second = 'preview')
CREATE POLICY "Clients can view preview files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.client_user_id = auth.uid()
      AND (storage.foldername(name))[1] = p.id::text
      AND (storage.foldername(name))[2] = 'preview'
  )
);
