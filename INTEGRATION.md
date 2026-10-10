# Run the integrated app

The React frontend uses Supabase for email and OAuth accounts. FastAPI verifies the Supabase access token with the Auth service before creating a local owner identity. Business data, offers, likes and comments are stored in SQLite, not Supabase tables. Any signed-in Supabase account may set up a business; the frontend role choice is not an eligibility check.

## Frontend terminal

Create `.env` in the repository root using `.env.example`. Set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
VITE_API_URL=http://127.0.0.1:8000
```

Then run `npm install` and `npm run dev`. Open the address printed by Vite (normally http://localhost:5173). Supabase must allow that address and `/auth/callback` in its redirect settings. Keep your existing signup, email confirmation and OAuth provider settings.

## Backend terminal

From the repository root:

```powershell
cd Backend
$env:SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY = "YOUR_PUBLIC_KEY"
$env:CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
$env:SEED_DEMO = "true"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Use the same Supabase project in both terminals. Only its public publishable/anon key is needed; no service-role key is required. Environment examples are templates, not live configuration. `Backend/.env` is not automatically loaded.

Demo seeding runs only when no owner exists. The fictional demo usernames are FastAPI-only accounts and do not log in through the Supabase frontend. Create/sign into a Supabase account to publish through the website. Existing Supabase table data is not imported into SQLite by this integration.

## Test the website

1. Visit `/feed` while logged out: backend offers appear; search and categories filter them. A stopped backend should show an error and retry control, not fake data.
2. Sign up or log in with Supabase. Complete email confirmation if required.
3. Open business setup. Save a category, description, WhatsApp number or website and optionally a logo. Refresh: the saved profile remains.
4. Create a post with a numeric NGN price (for example `3500` or `₦3,500`), or leave price empty for contact pricing. Upload an image or provide an HTTP/HTTPS image URL. Publishing should put the returned offer in the feed.
5. Open its details, add a comment and like it. Refresh: the comment and like persist. Unavailable offers have no contact buttons; website-only businesses have website contact.
6. Open My profile → Manage my offers (`/owner`). Toggle availability and move an offer to draft; it must disappear from public discovery. Publishing it again restores it if available.
7. Sign in as another account. Its dashboard must not contain the first owner's offers.

## Automated verification

Run `npm run build` in the root and `.\.venv\Scripts\python.exe -m pytest -q` in Backend. Supabase integration tests mock the Auth response to verify token rejection, account mapping and owner isolation without creating real accounts. A real Supabase account and configured project are still needed for the live website journey.

Run `node scripts/check-business-save.mjs` for frontend API adapter checks (authentication header, business mapping, numeric/contact pricing, save errors and browser likes). Initial verification passed the production build, these adapter checks and all 22 backend tests.

Images are stored in `Backend/uploads` and served publicly under `/media`. Persist that directory and SQLite on your backend host. Use the public HTTPS API address in `VITE_API_URL` before building for deployment; configure proxy headers so uploaded image URLs use the correct public address. Following and saved posts remain browser-local features. Existing Supabase profile editing remains handled by Supabase.
