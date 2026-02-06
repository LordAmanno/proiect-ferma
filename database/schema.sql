-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Fields
create table public.fields (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  area_hectares numeric,
  location_coordinates text,
  soil_type text,
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Workers
create table public.workers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  hourly_rate numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Crops
create table public.crops (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  variety text,
  field_id uuid references public.fields(id),
  planting_date timestamp with time zone,
  expected_harvest_date timestamp with time zone,
  actual_harvest_date timestamp with time zone,
  status text default 'Growing',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Tasks
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'Pending',
  priority text default 'Medium',
  due_date timestamp with time zone,
  assigned_worker_id uuid references public.workers(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Inventory
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  item_name text not null,
  category text,
  quantity numeric default 0,
  unit text,
  low_stock_threshold numeric default 10,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'Income' or 'Expense'
  category text,
  amount numeric not null,
  date timestamp with time zone default timezone('utc'::text, now()),
  description text,
  related_crop_id uuid references public.crops(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) but allow public access for now
alter table public.fields enable row level security;
alter table public.workers enable row level security;
alter table public.crops enable row level security;
alter table public.tasks enable row level security;
alter table public.inventory enable row level security;
alter table public.transactions enable row level security;

-- Policies to allow public access (anon role)
create policy "Enable all for anon" on public.fields for all using (true) with check (true);
create policy "Enable all for anon" on public.workers for all using (true) with check (true);
create policy "Enable all for anon" on public.crops for all using (true) with check (true);
create policy "Enable all for anon" on public.tasks for all using (true) with check (true);
create policy "Enable all for anon" on public.inventory for all using (true) with check (true);
create policy "Enable all for anon" on public.transactions for all using (true) with check (true);

-- Seed Data
insert into public.fields (name, area_hectares, soil_type, status) values
('North Field', 12.5, 'Loam', 'Active'),
('South Field', 8.2, 'Clay', 'Fallow');

insert into public.workers (name, role, hourly_rate) values
('John Doe', 'Supervisor', 25.00),
('Jane Smith', 'Harvester', 18.50);

insert into public.inventory (item_name, category, quantity, unit, low_stock_threshold) values
('NPK Fertilizer', 'Fertilizers', 500, 'kg', 50),
('Diesel', 'Fuel', 120, 'liters', 200);

insert into public.transactions (type, category, amount, date, description) values
('Expense', 'Seeds', 450.00, now(), 'Corn seeds purchase'),
('Income', 'Sales', 1200.00, now(), 'Wheat sales');
