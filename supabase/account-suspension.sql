-- Run after business-approval.sql. Suspension is reversible and preserves data.
begin;
create table if not exists public.account_suspensions(user_id uuid primary key references auth.users(id), suspended boolean not null default false, reason text not null, updated_at timestamptz not null default now(), updated_by uuid not null references auth.users(id));
create table if not exists public.account_suspension_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),suspended boolean not null,reason text not null,reviewer_id uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.account_suspensions enable row level security;
alter table public.account_suspension_events enable row level security;
revoke all on public.account_suspensions,public.account_suspension_events from anon,authenticated;
create or replace function public.is_account_active(p_user_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select not exists(select 1 from public.account_suspensions where user_id=p_user_id and suspended); $$;
create or replace function public.my_account_status() returns jsonb language sql stable security definer set search_path='' as $$ select coalesce((select jsonb_build_object('suspended',suspended,'reason',reason) from public.account_suspensions where user_id=auth.uid()),'{"suspended":false}'::jsonb); $$;
create or replace function public.admin_account_list() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_biziz_admin() then raise exception 'Admin access required.' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'email',u.email,'name',coalesce(u.raw_user_meta_data->>'name','PAU member'),'suspended',coalesce(s.suspended,false),'reason',coalesce(s.reason,''),'is_admin',exists(select 1 from public.admin_members a where a.user_id=u.id)) order by u.created_at desc) from auth.users u left join public.account_suspensions s on s.user_id=u.id),'[]'::jsonb);
end $$;
create or replace function public.set_account_suspension(p_user_id uuid,p_suspended boolean,p_reason text,p_expected_suspended boolean) returns void language plpgsql security definer set search_path='' as $$
declare existing boolean;
begin
 if not public.is_biziz_admin() then raise exception 'Admin access required.' using errcode='42501'; end if;
 if p_suspended is null or char_length(trim(coalesce(p_reason,'')))<3 or char_length(p_reason)>1000 then raise exception 'Provide a reason (3–1000 characters).'; end if;
 perform 1 from auth.users where id=p_user_id for update;
 if not found then raise exception 'Account no longer exists.'; end if;
 if exists(select 1 from public.admin_members where user_id=p_user_id) then raise exception 'Admin accounts cannot be suspended here.'; end if;
 select coalesce((select suspended from public.account_suspensions where user_id=p_user_id),false) into existing;
 if existing is distinct from p_expected_suspended then raise exception 'Account status changed. Refresh before continuing.'; end if;
 insert into public.account_suspensions(user_id,suspended,reason,updated_by) values(p_user_id,p_suspended,trim(p_reason),auth.uid()) on conflict(user_id) do update set suspended=excluded.suspended,reason=excluded.reason,updated_by=excluded.updated_by,updated_at=now();
 insert into public.account_suspension_events(user_id,suspended,reason,reviewer_id) values(p_user_id,p_suspended,trim(p_reason),auth.uid());
end $$;
create or replace function public.guard_suspended_account() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and not public.is_account_active(auth.uid()) then raise exception 'Your account is suspended. Contact PAU Biziz administration.' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['businesses','posts','profiles','post_likes','post_comments'] loop
  if to_regclass('public.'||t) is not null then
   execute format('drop trigger if exists guard_suspended_account on public.%I',t);
   execute format('create trigger guard_suspended_account before insert or update or delete on public.%I for each row execute function public.guard_suspended_account()',t);
  end if;
 end loop;
end $$;
drop policy if exists "Read visible businesses" on public.businesses;
create policy "Read visible businesses" on public.businesses for select using((approval_status='approved' and public.is_account_active(owner_id)) or owner_id=auth.uid() or public.is_biziz_admin());
drop policy if exists "Read visible posts" on public.posts;
create policy "Read visible posts" on public.posts for select using(exists(select 1 from public.businesses b where b.id=business_id and ((b.approval_status='approved' and public.is_account_active(b.owner_id)) or b.owner_id=auth.uid() or public.is_biziz_admin())));
revoke all on function public.is_account_active(uuid),public.my_account_status(),public.admin_account_list(),public.set_account_suspension(uuid,boolean,text,boolean),public.guard_suspended_account() from public;
grant execute on function public.is_account_active(uuid) to anon,authenticated;
grant execute on function public.my_account_status(),public.admin_account_list(),public.set_account_suspension(uuid,boolean,text,boolean) to authenticated;
commit;
