-- Optional integration checks AFTER business-approval.sql. All fixture writes are rolled back.
-- Requires the activated admin account and at least one other registered user.
begin;
select set_config('biziz.test.admin',(select user_id::text from public.admin_members limit 1),true);
select set_config('biziz.test.owner',(select id::text from auth.users where id not in(select user_id from public.admin_members) limit 1),true);
select set_config('biziz.test.business',gen_random_uuid()::text,true);
do $$ begin if nullif(current_setting('biziz.test.admin'),'') is null or nullif(current_setting('biziz.test.owner'),'') is null then raise exception 'Checks require an activated admin and a non-admin account.'; end if; end $$;
insert into public.businesses(id,owner_id,name,description,category,whatsapp) values(current_setting('biziz.test.business')::uuid,current_setting('biziz.test.owner')::uuid,'Transactional verification test','Rolled back at the end','Other','+2348000000000');

set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('biziz.test.owner'),true);
do $$ begin
 if public.is_biziz_admin() then raise exception 'FAIL: ordinary owner has admin access'; end if;
 begin perform public.admin_business_queue();raise exception 'FAIL: owner read admin queue';exception when insufficient_privilege then null;end;
 begin perform public.review_business(current_setting('biziz.test.business')::uuid,'approved','Self approval','pending');raise exception 'FAIL: owner self-approved';exception when insufficient_privilege then null;end;
 begin update public.businesses set approval_status='approved' where id=current_setting('biziz.test.business')::uuid;raise exception 'FAIL: owner wrote moderation status';exception when insufficient_privilege then null;end;
 begin insert into public.posts(business_id,title,description,category,availability) values(current_setting('biziz.test.business')::uuid,'Test','Test','Other','Available');raise exception 'FAIL: pending business published';exception when insufficient_privilege then null;end;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin if exists(select 1 from public.businesses where id=current_setting('biziz.test.business')::uuid) then raise exception 'FAIL: pending business is public';end if;end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('biziz.test.admin'),true);
select public.review_business(current_setting('biziz.test.business')::uuid,'approved','Transactional PAU-list verification test','pending');
do $$ begin
 if not exists(select 1 from public.business_review_events where business_id=current_setting('biziz.test.business')::uuid) then raise exception 'FAIL: no review audit event';end if;
 begin perform public.review_business(current_setting('biziz.test.business')::uuid,'rejected','Stale review test','pending');raise exception 'FAIL: stale review accepted';exception when raise_exception then if sqlerrm not like 'This application changed.%' then raise;end if;end;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin if not exists(select 1 from public.businesses where id=current_setting('biziz.test.business')::uuid and approval_status='approved') then raise exception 'FAIL: approved business not visible';end if;end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('biziz.test.owner'),true);
insert into public.posts(business_id,title,description,category,availability) values(current_setting('biziz.test.business')::uuid,'Test','Test','Other','Available');
update public.businesses set name='Changed identity test' where id=current_setting('biziz.test.business')::uuid;
do $$ begin if not exists(select 1 from public.businesses where id=current_setting('biziz.test.business')::uuid and approval_status='pending') then raise exception 'FAIL: identity edit did not reset review';end if;end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin if exists(select 1 from public.posts where business_id=current_setting('biziz.test.business')::uuid) then raise exception 'FAIL: pending-business post is public';end if;end $$;
rollback;
select 'PASS: owner cannot grant admin/self-approve/publish pending; admin decision audited; stale reviews rejected; visibility and resubmission enforced.' as result;
