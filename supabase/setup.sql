-- Run in your Supabase project's SQL Editor. Owner identity comes from Supabase Auth.
create table if not exists public.businesses (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null, description text not null, category text not null,
 whatsapp text not null, logo_url text, created_at timestamptz not null default now()
);
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 title text not null, description text not null, category text not null,
 image_url text, price text, availability text not null, created_at timestamptz not null default now()
);
alter table public.businesses enable row level security;
alter table public.posts enable row level security;
create policy "Anyone can read businesses" on public.businesses for select using (true);
create policy "Owners insert businesses" on public.businesses for insert to authenticated with check (auth.uid()=owner_id);
create policy "Owners update businesses" on public.businesses for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "Anyone can read posts" on public.posts for select using (true);
create policy "Owners insert posts" on public.posts for insert to authenticated with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "Owners update posts" on public.posts for update to authenticated using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())) with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
