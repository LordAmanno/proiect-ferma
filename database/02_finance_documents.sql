-- Create table for Finance Documents
create table public.finance_documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  document_date timestamp with time zone default timezone('utc'::text, now()),
  uploaded_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.finance_documents enable row level security;

-- Policy
create policy "Enable all for anon" on public.finance_documents for all using (true) with check (true);

-- Create Storage Bucket (This is usually done via API or Dashboard, but we document it here)
-- Bucket name: 'finance-docs'
