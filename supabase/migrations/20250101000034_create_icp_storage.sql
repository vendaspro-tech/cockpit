-- Create storage bucket for ICP images
insert into storage.buckets (id, name, public)
values ('icp-images', 'icp-images', true)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload images
create policy "Authenticated users can upload ICP images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'icp-images' );

-- Policy to allow public to view images
create policy "Public can view ICP images"
on storage.objects for select
to public
using ( bucket_id = 'icp-images' );

-- Policy to allow authenticated users to delete their images (or all images for simplicity in this context)
create policy "Authenticated users can delete ICP images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'icp-images' );
