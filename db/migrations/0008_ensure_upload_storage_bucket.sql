-- Ensure the browser upload target exists before storage RLS policies are used.

insert into storage.buckets (id, name, public, file_size_limit)
values ('ekalox-uploads', 'ekalox-uploads', false, 52428800)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = 52428800;
