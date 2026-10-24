-- Exact PAU-only NEW signup and email changes; existing admin sign-in is unaffected.
-- Apply independently from the larger launch migrations.
begin;
create or replace function public.enforce_pau_student_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.email is not distinct from old.email then return new; end if;
 if lower(split_part(coalesce(new.email,''),'@',2))<>'pau.edu.ng' then
  raise exception 'Use your @pau.edu.ng student email.' using errcode='23514';
 end if;
 return new;
end $$;
drop trigger if exists pau_student_email on auth.users;
create trigger pau_student_email before insert or update of email on auth.users for each row execute function public.enforce_pau_student_email();
revoke all on function public.enforce_pau_student_email() from public;
commit;
