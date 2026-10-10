# PAU biziz backend

FastAPI and SQLite groundwork for the campus business discovery MVP. The newer draft in `Req.docx` supplies the API behavior, including website-only businesses, optional image/video links, browser likes and comments. These extend the older product brief. Browsing is public; business and post management require an owner session. This is a local hackathon baseline.

## Start on Windows

Use a standard Python 3.12+ installation. Run from the repository root:

```powershell
cd Backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
$env:SEED_DEMO = "true"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for interactive API documentation, http://127.0.0.1:8000/openapi.json for the frontend contract, and http://127.0.0.1:8000/health for the database health check. `uvicorn main:app --reload` also works from this folder.

The first startup creates `Backend/pau_biziz.db`. Demo seeding is opt-in and only runs when no owner exists. It creates four fictional businesses and fourteen offers (thirteen available, one unavailable). Logins: `demo_cakes`, `demo_style`, `demo_tech`, `demo_web`; password for all: `pass123`. These credentials and invented phone numbers are for demonstration only. Do not actually contact those numbers; replace them with team-controlled destinations before demonstrating seller contact.

For an empty database, leave `SEED_DEMO` unset or set it to `false`. Provision an owner with `python manage.py your_username`; it prompts for a password. Then log in and set up their business. There is no public registration endpoint.

## Configuration

`.env.example` documents `DB_PATH`, `SEED_DEMO`, and `CORS_ORIGINS`. The application reads environment variables; it does not automatically load `.env` files. PowerShell example:

```powershell
$env:CORS_ORIGINS = "http://localhost:5173,http://localhost:3000"
$env:DB_PATH = "C:\path\to\pau_biziz.db"
```

`localhost` and `127.0.0.1` are different origins; add the frontend's exact origin if needed. Keep database files, virtual environments and secrets out of Git. Default database location is stable even if you launch from another working directory; a configured relative `DB_PATH` is relative to that launch directory. The parent directory must already exist.

## API contract

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | Database connectivity |
| POST | `/auth/login` | Username/password → token, type, expiry, business setup flag |
| POST | `/auth/logout` | Revoke current session |
| GET | `/categories` | Food, Fashion, Academics, Tech, Services |
| GET | `/posts` | Published available offers, newest first; optional `category` |
| GET | `/search` | Optional `q` and `category`; separate `posts` and `businesses` arrays |
| GET | `/posts/{id}` | Published offer details, including unavailable offers |
| GET | `/businesses` | Business directory; optional `category` |
| GET | `/businesses/{id}` | Profile plus published offers, including unavailable offers |
| POST | `/posts/{id}/like` | Toggle browser like; requires `x-client-id` |
| GET/POST | `/posts/{id}/comments` | Read/add comments on published offers |
| GET/PUT | `/owner/business` | Read/create/replace own business profile |
| GET/POST | `/owner/posts` | All own offers / create offer |
| PUT | `/owner/posts/{id}` | Replace editable fields on own offer |
| PATCH | `/owner/posts/{id}/availability` | Toggle availability |
| DELETE | `/owner/comments/{id}` | Remove comment from own offer |

Owner routes and logout require `Authorization: Bearer <token>`. Sessions expire after eight hours. A new login invalidates that owner's previous token. Passwords use salted scrypt; only a SHA-256 digest of each random session token is stored.

Optional `x-client-id` on feed, search, detail and business profile populates `liked_by_me`. Frontend should generate a UUID once and keep it in localStorage. This identifies a browser, not a verified student; anyone can generate another ID. Disable the like button while its toggle request is in flight; retrying a successful toggle reverses it.

Business input:

```json
{"name":"Campus Cakes","category":"Food","description":"Cakes on campus","whatsapp_number":"2348012345678","website_url":null,"fulfillment_info":"Pickup at student centre"}
```

At least one of WhatsApp or website is required. WhatsApp numbers are normalized to country-code digits. Website and media links must use HTTP/HTTPS; a missing scheme becomes HTTPS. No media upload endpoint exists; supply externally hosted URLs and use a placeholder for null images.

Post input:

```json
{"title":"Birthday cake","description":"Vanilla sponge","category":"Food","image_url":null,"video_url":null,"website_url":null,"price_mode":"amount","price_amount":12000,"publication_status":"draft"}
```

`price_mode` is `amount` or `contact`; numeric prices must be finite and nonnegative. Zero displays `Free`; contact mode clears the amount. Currency is NGN. Use `publication_status: "draft"` to save a preview and PUT the complete payload with `published` to publish. PUT replaces optional fields too; send the entire editable object. Availability is controlled separately through the toggle endpoint. Missing business setup returns 400, invalid fields 422, bad/expired login 401, cross-owner edits 403 and missing/hidden resources 404.

Responses include `price_label`, business information, like/comment counts and contact links. Post website overrides business website; unavailable offers have neither inquiry link. Business profile contact remains available. Search is deterministic SQLite keyword matching; `%` and `_` act as LIKE wildcards. No price filter, payments or in-app messaging.

## Working together

| Developer | Main files and responsibility |
| --- | --- |
| Backend developer 1 | `routes/auth.py`, `routes/owner.py`, `security.py`: accounts, profile setup, publishing, owner permissions |
| Backend developer 2 | `routes/public.py`, `routes/engagement.py`, `presentation.py`: browsing, search, contact links, likes, comments |
| Agree together | `schemas.py`, `constants.py`, `database.py`: request fields, categories, schema changes and frontend contract |

Keep frontend field names aligned with `/docs`. Coordinate edits to shared files before changing them. A useful next task is frontend integration of login → setup → draft → publish → search → mark unavailable.

## Verification

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Tests use an isolated temporary database and cover discovery, contact links, input validation, draft privacy, ownership, publication, availability, likes, moderation, password/session storage, expiry, logout and persistence across startup. Demo seeds are not written into your working database by the tests. Startup uses the FastAPI [lifespan mechanism](https://fastapi.tiangolo.com/advanced/events/).

Initial verification: four integration tests passed on Python 3.12. The installed Starlette version emits a deprecation warning for HTTPX in its test client; tests still pass. `requirements-lock.txt` records the complete tested dependency set; install it instead of `requirements-dev.txt` to reproduce those exact versions.

## Boundaries and next steps

There is no schema migration framework yet. `CREATE TABLE IF NOT EXISTS` handles a fresh database and repeated startup, not upgrades from the document's old plain-text schema. Use a different `DB_PATH` for this baseline; preserve any existing data and plan a migration before changing schema. Do not delete existing databases to upgrade.

Public rollout still needs login and comment rate limits, reporting/moderation policy, owner eligibility decisions, pagination, media storage and deployment configuration with HTTPS. Comments are anonymous display names: the frontend must render them as plain text. SQLite and floating-point prices are suitable for this discovery demo; revisit database hosting and integer minor-unit prices before adding payments. Demo seeding should run under one server process. No production deployment is included.
