-- Apply in Supabase SQL Editor. Existing businesses also enter review; none are auto-verified.
begin;
create table if not exists public.admin_members(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.admin_members enable row level security;
revoke all on public.admin_members from anon,authenticated;
create or replace function public.is_biziz_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_members where user_id=auth.uid());
$$;
revoke all on function public.is_biziz_admin() from public;
grant execute on function public.is_biziz_admin() to anon,authenticated;

create table if not exists public.verified_business_reference(name text primary key,owner_name text not null,offering text not null);
alter table public.verified_business_reference enable row level security;
revoke all on public.verified_business_reference from anon,authenticated;
grant select on public.verified_business_reference to authenticated;
drop policy if exists "Admins read verified list" on public.verified_business_reference;
create policy "Admins read verified list" on public.verified_business_reference for select to authenticated using(public.is_biziz_admin());
insert into public.verified_business_reference(name,owner_name,offering) values
 ('Nonye’s Pasta','Attah Chukwunonyelum','Pasta meals to order, catering and delivery'),
 ('Suya Plug','Juliet Alabojuto','Suya and grills, evenings at the Student Centre'),
 ('Cherie_CoCo_Essence','Joy Samuel','Perfumes, body mists and lip gloss'),
 ('Blazers Robotics','Oryiman Adongo','Robotics and IoT parts, 3D printing'),
 ('Book Runner','Emmanuel Mensah','Textbooks, notebooks, lab coats and stationery'),
 ('Lucy Creations','Mary Fagbohun','Packaged snacks, delivered on campus'),
 ('Pick Up Pals','Emmanuel Mensah','Pickup and delivery of your online orders'),
 ('Campus Cravings','Adedamola Kukoyi','Snacks, drinks and confectionery'),
 ('Quick Bites','Anselm Ilekuba','Packaged kilishi and snacks'),
 ('Chic Press','Adenike Adewole','Press-on nails'),
 ('House of Asemota','Emmanuella Asemota','African ready-to-wear: dresses, skirts, kimonos'),
 ('Jozie Glam and Glow','Joanita Ojiemeke & Zainab Alola','Jewellery and everyday cosmetics'),
 ('V’s Collection','Dabelechukwu Okonkwo','Necklaces, earrings, bracelets and watches'),
 ('Fervora','Adetola Akinfolaranmi','Body mists, sprays and deodorants'),
 ('PartsNGadgets','Benita Ajagunna','Hardware components and tech gadgets'),
 ('Pizzazz Crafts','Flourish Sannitops','Yarn, crochet hooks and craft supplies')
on conflict(name) do update set owner_name=excluded.owner_name,offering=excluded.offering;

alter table public.businesses add column if not exists approval_status text not null default 'pending' check(approval_status in ('pending','approved','rejected'));
alter table public.businesses add column if not exists review_note text not null default '';
alter table public.businesses add column if not exists reviewed_at timestamptz;
alter table public.businesses add column if not exists reviewed_by uuid references auth.users(id);
create table if not exists public.business_review_events(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id),reviewer_id uuid not null references auth.users(id),previous_status text not null,status text not null,evidence_or_reason text not null,created_at timestamptz not null default now());
alter table public.business_review_events enable row level security;
revoke all on public.business_review_events from anon,authenticated;
grant select on public.business_review_events to authenticated;
drop policy if exists "Admins read review history" on public.business_review_events;
create policy "Admins read review history" on public.business_review_events for select to authenticated using(public.is_biziz_admin());

create or replace function public.guard_business_review() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  if new.approval_status<>'pending' or new.review_note<>'' or new.reviewed_by is not null or new.reviewed_at is not null then raise exception 'New businesses must enter review.'; end if;
 elsif not public.is_biziz_admin() then
  if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id then raise exception 'Business ownership cannot be changed.'; end if;
  if (new.approval_status,new.review_note,new.reviewed_at,new.reviewed_by) is distinct from (old.approval_status,old.review_note,old.reviewed_at,old.reviewed_by) then raise exception 'Only admins can change business approval.'; end if;
  -- Changes to identity or contact details need another review, including rejected resubmissions.
  if (new.name,new.description,new.category,new.whatsapp,new.logo_url) is distinct from (old.name,old.description,old.category,old.whatsapp,old.logo_url) then
   new.approval_status='pending';new.review_note='';new.reviewed_at=null;new.reviewed_by=null;
  end if;
 end if;
 return new;
end $$;
drop trigger if exists guard_business_review on public.businesses;
create trigger guard_business_review before insert or update on public.businesses for each row execute function public.guard_business_review();

drop policy if exists "Anyone can read businesses" on public.businesses;
drop policy if exists "Read visible businesses" on public.businesses;
create policy "Read visible businesses" on public.businesses for select using(approval_status='approved' or owner_id=auth.uid() or public.is_biziz_admin());
drop policy if exists "Admins review businesses" on public.businesses;
create policy "Admins review businesses" on public.businesses for update to authenticated using(public.is_biziz_admin()) with check(public.is_biziz_admin());
-- Client updates cannot write moderation columns; the checked RPC is the review entry point.
revoke update on public.businesses from authenticated;
grant update(name,description,category,whatsapp,logo_url) on public.businesses to authenticated;
-- Existing owner insert/update policies are retained; the trigger protects moderation fields.
drop policy if exists "Anyone can read posts" on public.posts;
drop policy if exists "Read visible posts" on public.posts;
create policy "Read visible posts" on public.posts for select using(exists(select 1 from public.businesses b where b.id=business_id and (b.approval_status='approved' or b.owner_id=auth.uid() or public.is_biziz_admin())));
drop policy if exists "Owners insert posts" on public.posts;
create policy "Owners insert posts" on public.posts for insert to authenticated with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid() and b.approval_status='approved'));

create or replace function public.admin_business_queue() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_biziz_admin() then raise exception 'Admin access required.' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(b)||jsonb_build_object('owner_email',u.email,'owner_name',coalesce(u.raw_user_meta_data->>'name','PAU member')) order by b.created_at desc) from public.businesses b join auth.users u on u.id=b.owner_id),'[]'::jsonb);
end $$;
create or replace function public.review_business(p_business_id uuid,p_status text,p_reason text,p_expected_status text) returns void language plpgsql security definer set search_path='' as $$
declare existing_status text;
begin
 if not public.is_biziz_admin() then raise exception 'Admin access required.' using errcode='42501'; end if;
 if p_status not in ('approved','rejected') or p_status is null then raise exception 'Choose approve or reject.'; end if;
 if char_length(trim(coalesce(p_reason,'')))<3 or char_length(p_reason)>1000 then raise exception 'Provide a verification reference or rejection reason (3–1000 characters).'; end if;
 select approval_status into existing_status from public.businesses where id=p_business_id for update;
 if not found then raise exception 'Business no longer exists.'; end if;
 if existing_status is distinct from p_expected_status then raise exception 'This application changed. Refresh before reviewing.'; end if;
 update public.businesses set approval_status=p_status,review_note=case when p_status='approved' then 'Verified against PAU''s approved-business list.' else trim(p_reason) end,reviewed_at=now(),reviewed_by=auth.uid() where id=p_business_id;
 insert into public.business_review_events(business_id,reviewer_id,previous_status,status,evidence_or_reason) values(p_business_id,auth.uid(),existing_status,p_status,trim(p_reason));
end $$;
revoke all on function public.admin_business_queue() from public;
revoke all on function public.review_business(uuid,text,text,text) from public;
grant execute on function public.admin_business_queue() to authenticated;
grant execute on function public.review_business(uuid,text,text,text) to authenticated;

-- Assign only the confirmed account requested by the project owner. No frontend role is trusted.
insert into public.admin_members(user_id) select id from auth.users where lower(email)='bensagie4@gmail.com' and email_confirmed_at is not null on conflict do nothing;
commit;
select case when exists(select 1 from public.admin_members a join auth.users u on u.id=a.user_id where lower(u.email)='bensagie4@gmail.com') then 'Admin activated. Sign in at /admin.' else 'Create/confirm bensagie4@gmail.com in Authentication > Users, then rerun this script to activate admin access.' end as admin_setup;
