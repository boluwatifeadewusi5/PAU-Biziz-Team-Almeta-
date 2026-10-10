begin;
-- Remove only empty VGLchefs trial profiles belonging to the owner of the posted profile.
-- Does not delete authentication users, posts, or any other business.
delete from public.businesses b
using public.businesses kept
where kept.id='12526ec3-3dc5-4a09-9d24-6a3566bfeda4'
and b.owner_id=kept.owner_id and lower(trim(b.name))=lower(trim(kept.name))
and b.id<>kept.id and not exists(select 1 from public.posts p where p.business_id=b.id);

create table if not exists public.post_likes(
 post_id text not null, user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(post_id,user_id)
);
create table if not exists public.post_comments(
 id uuid primary key default gen_random_uuid(),post_id text not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 author_name text not null,body text not null check(char_length(trim(body)) between 1 and 1000),
 created_at timestamptz not null default now()
);
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
drop policy if exists "Read likes" on public.post_likes;
create policy "Read likes" on public.post_likes for select using(true);
drop policy if exists "Like as self" on public.post_likes;
create policy "Like as self" on public.post_likes for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "Unlike as self" on public.post_likes;
create policy "Unlike as self" on public.post_likes for delete to authenticated using(auth.uid()=user_id);
drop policy if exists "Read comments" on public.post_comments;
create policy "Read comments" on public.post_comments for select using(true);
drop policy if exists "Comment as self" on public.post_comments;
create policy "Comment as self" on public.post_comments for insert to authenticated with check(auth.uid()=user_id and author_name=coalesce(auth.jwt()->'user_metadata'->>'name',auth.jwt()->'user_metadata'->>'full_name','PAU member'));
create index if not exists post_comments_post_idx on public.post_comments(post_id,created_at);
commit;

-- Inspect the retained business and post after cleanup.
select b.id,b.name,count(p.id) as posts from public.businesses b
left join public.posts p on p.business_id=b.id where lower(trim(b.name))='vglchefs' group by b.id,b.name;
