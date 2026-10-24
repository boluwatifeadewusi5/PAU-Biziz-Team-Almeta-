# PAU email signup with OTP, without buying a domain

The sender can be an existing Gmail account. Recipients must use exactly @pau.edu.ng.

1. On the sender Google account, enable 2-Step Verification and create an app password.
2. Enter it directly in Supabase Authentication -> email -> custom SMTP:
   sender email and SMTP username = that Gmail address; sender name = PAU Biziz;
   host = smtp.gmail.com; port = 465; password = the Google app password.
   Never put an SMTP password in the frontend, repository, logs or chat.
3. Save SMTP and test delivery to a real PAU inbox before rollout. Check Gmail and
   Supabase sending quotas. Gmail is a temporary sender, not proof of 3,000-user capacity.
4. Put supabase/templates/confirm-signup.html in the Confirm signup email template.
   It contains {{ .Token }} and does not depend on clicking a link.
5. Enable Confirm email. Keep Allow new users to sign up enabled.
6. Apply supabase/pau-email-only.sql. The frontend gate alone is insufficient.
7. Release only the OTP-related frontend files, not the unrelated pending launch migrations.
8. Test valid PAU signup, non-PAU rejection via both UI and Auth API, wrong/expired/reused
   OTP, resend cooldown, reload after signup and successful login after verification.

Local tests mock Supabase; they do not prove that real email delivery works.
Existing accounts created with auto-confirm enabled need a separate re-verification
plan before the public launch; a legacy confirmed timestamp is not proof of inbox ownership.
