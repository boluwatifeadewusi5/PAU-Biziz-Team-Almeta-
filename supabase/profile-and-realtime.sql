-- Run after social-and-cleanup.sql in Supabase SQL Editor.
begin;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,avatar_url text not null default '',bio text not null default '');
alter table public.profiles enable row level security;
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles for select to authenticated using(auth.uid()=id);
drop policy if exists "Insert own profile" on public.profiles;
create policy "Insert own profile" on public.profiles for insert to authenticated with check(auth.uid()=id);
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='post_likes') then alter publication supabase_realtime add table public.post_likes; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='post_comments') then alter publication supabase_realtime add table public.post_comments; end if;
end $$;
commit;
