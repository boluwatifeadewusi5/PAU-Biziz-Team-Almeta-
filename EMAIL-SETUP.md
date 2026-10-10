# Student signup and email delivery

Students can sign up only with the exact configured PAU student email domain. The current provisional domain is `pau.edu.ng`; confirm it with PAU before applying `supabase/pau-email-only.sql`. Set `VITE_STUDENT_EMAIL_DOMAIN` if the real domain differs, and update the SQL domain to match. The frontend validates before sending an email request; the SQL trigger enforces the rule on direct API signups too. The designated Gmail admin signs in through `/login?next=/admin` and does not use student signup.

Student accounts require email confirmation only. They do not need admin approval. A student can add one or more businesses after signing in; those business applications each need admin approval.

Production public checks found signup enabled, email/password enabled, and email confirmation required. The supplied admin credentials successfully signed in with a confirmed email. These checks do not prove delivery to a new student mailbox. The public key cannot inspect SMTP credentials, configure the sender, or read Auth logs.

Supabase's default sender has limited delivery and low send limits. Changing the confirmation UI to OTP or another link format does not remove sender restrictions. Configure a custom sender in Supabase Authentication > Email > SMTP settings. Keep Confirm Email enabled.

For a Gmail sender, enter the credentials directly into Supabase, never into source files or chat:

- SMTP host: `smtp.gmail.com`
- Port: `465` (SSL) or `587` (STARTTLS)
- Username: the full sender Gmail address
- Password: a Google app password, not the PAU biziz account password
- Sender email: the same Gmail address
- Sender name: `PAU biziz`

Create the app password in the sender's Google account, if available. Google requires 2-Step Verification for app passwords; some managed accounts disallow them. A configured transactional SMTP provider is an alternative. Gmail is suitable for limited initial usage; its own limits still apply.

Set the Supabase Site URL to `https://pau-biziz.vercel.app` and allow `https://pau-biziz.vercel.app/auth/callback`. Verify a signup with a real, consenting PAU mailbox, check inbox and spam, then open the confirmation link and log in. Do not repeatedly attempt signup while rate-limited.

References: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Google SMTP](https://support.google.com/mail/answer/7104828), [Google app passwords](https://support.google.com/accounts/answer/185833).
