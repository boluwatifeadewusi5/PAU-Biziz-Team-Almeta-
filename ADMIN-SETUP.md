# PAU biziz business review

1. Confirm the account for `bensagie4@gmail.com` from its Supabase confirmation email. Display name: `PAU-biziz admin`. The requested password is not included in this repository. If the account already exists, signup does not replace its password.
2. Run `supabase/business-approval.sql` in the project's SQL Editor after the original `setup.sql`. The final result must say `Admin activated`.
3. Open `/admin`, sign in, compare each application with the included PAU list, enter the list reference or rejection reason, and approve/reject it.

The SQL keeps the supplied 16-business list visible only to admins. Name matching is a review aid, not proof of the owner's identity. The list does not create user accounts or fabricated public listings.

All existing businesses enter pending review on first migration. They and their offers stay hidden until approved; no records are deleted. New pending or rejected businesses cannot publish posts. Owners can edit and resubmit applications. Changes to business details reset approval to pending. Rejection reasons are shown to the owner. Admin reviews are recorded with reviewer, decision, timestamp and verification reference.

Admin authorization comes from a protected `admin_members` table; user-editable metadata and client-side flags do not grant access. Row-level security controls public visibility and publishing; triggers protect moderation fields and ownership. The admin RPC checks permissions again and rejects stale review decisions.

The public publishable key cannot apply migrations or grant admin privileges. Until the SQL is applied, the application fails closed for approval and publishing. Do not rerun the original schema policies after this migration; they would restore the old unrestricted read policies.

Optional database integration verification: run `supabase/check-business-approval.sql` after activating the admin. It creates transactional fixtures and rolls back all writes. It checks owner/admin authorization, pending publishing restrictions, public visibility, review audit records, stale decisions, and resubmission. These checks have not been run against production until the migration is applied.
