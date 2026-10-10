# Connect PAU biziz

1. Sign in at https://supabase.com/dashboard and create a project. Keep the database password private.
2. Open SQL Editor and run `supabase/setup.sql` once.
3. In Authentication → URL Configuration, set Site URL to `https://pau-biziz.vercel.app` and allow that domain's redirects.
4. Find the project URL and publishable key in the project's Connect/API settings. Share only those two public values with the developer, never the secret/service-role key or database password.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel environment settings and redeploy. For local use copy `.env.example` to `.env.local`.
6. Test signup, email confirmation, login, business setup, and posting in two different browsers. RLS must prevent one owner editing another owner's records.

PAU email is currently a placeholder, not an enforced domain restriction. Confirm the official email suffix before adding that rule. Supabase email delivery settings may need configuration before public signup volume grows.

Seed listings illustrate layout and are not owner accounts. No invented contact number should be used. Followers, saves, and likes currently persist on the current device; shared social features are a separate database iteration.
Email confirmations: add https://pau-biziz.vercel.app/auth/callback to Authentication > URL Configuration > Redirect URLs. Keep Site URL set to https://pau-biziz.vercel.app. Business role is stored in signup metadata; students go to /feed and business owners to /business/setup. Old links falling back to the homepage are handled as well.
