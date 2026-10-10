-- Confirm the student domain before running; currently @pau.edu.ng.
-- Existing accounts are retained. Only new signups and changed email addresses are checked.
begin;
create or replace function public.require_pau_signup_email() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and new.email is not distinct from old.email then return new;end if;
 if lower(coalesce(new.email,''))='bensagie4@gmail.com' then return new;end if;
 if lower(coalesce(new.email,'')) !~ '^[^@[:space:]]+@pau[.]edu[.]ng$' then
  raise exception 'Student signup requires a PAU email address (@pau.edu.ng).' using errcode='22023';
 end if;
 return new;
end $$;
drop trigger if exists require_pau_signup_email on auth.users;
create trigger require_pau_signup_email before insert or update of email on auth.users for each row execute function public.require_pau_signup_email();
revoke all on function public.require_pau_signup_email() from public;
commit;
