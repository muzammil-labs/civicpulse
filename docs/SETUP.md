# Setup guide

How to get the community app running, from an empty Supabase project to a live demo. The app lives in `civicpulse/`; run every command from there unless a step says otherwise.

## What you need

- Node.js 22 and npm
- A free [Supabase](https://supabase.com) account
- A Google AI Studio API key for photo suggestions. This is optional: without one, the app falls back to free keyword rules.
- `psql` and a local Postgres, only if you want to run the database tests yourself

## 1. Create the Supabase project

1. Create a new project. Choose the **Mumbai (ap-south-1)** region, so resident data stays in India and pages load faster for users there.
2. Save the database password somewhere safe.
3. Under **Project settings → API**, copy the **Project URL**, the **anon public** key and the **service_role** key.

## 2. Create the database

Apply the SQL files in `supabase/migrations/` **in filename order**. Pick one of two ways:

- **Supabase CLI (recommended):**
  ```bash
  npx supabase login
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push
  ```
- **Dashboard:** open **SQL Editor**, then paste and run each file in order.

Together, these files create:
- the tables
- row-level security (each society can only see its own data)
- the private `issue-media` storage bucket
- the `reset_demo()` function

## 3. Configure sign-in

Do these under **Authentication** in the Supabase dashboard:

1. **URL configuration:**
   - Set **Site URL** to your app's address (for local work, `http://localhost:3000`).
   - Add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback` to **Redirect URLs**.
2. **Email:** this provider is on by default, so committee members can sign in with a magic link straight away. Supabase's built-in email service is heavily rate-limited, so before launch add your own SMTP provider under **Authentication → SMTP**. Resend or Amazon SES both work.
3. **Phone (for residents):**
   - Enable the Phone provider and pick an SMS provider. Supabase supports Twilio, MessageBird, Vonage and Textlocal.
   - Indian SMS needs DLT registration, which your SMS provider helps with.
   - For lower costs, the plan in `docs/PRODUCT_PLAN.md` §8 uses WhatsApp OTP through Supabase's *Send SMS* auth hook. That is not built yet.
   - Until phone sign-in is set up, the login page tells residents to use email.

## 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. **Server-only; never expose it.** |
| `DEMO_USER_PASSWORD` | Any long random string (16+ characters) |
| `GEMINI_API_KEY` | Google AI Studio (optional) |
| `MOCK_AI` | `true` to never call the AI (free keyword rules only) |
| `NEXT_PUBLIC_BRAND_NAME` | The product name until it's final (default `Sahvaas`) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | The address shown on the site |

## 5. Create the demo society

```bash
npm install
npm run demo:setup
```

This command:
- creates three demo accounts: `demo-resident@example.com`, `demo-committee@example.com` and `demo-staff@example.com`;
- builds **Sunrise Enclave (Demo)**: 3 towers, 240 flats, 12 issues in different states, and 3 notices.

The "Try as …" buttons on `/login?demo=1` sign visitors into these accounts. No OTP or SMS is involved, so demos cost nothing.

**Reset it every night:** enable the `pg_cron` extension (**Database → Extensions**), then run this once in the SQL Editor:

```sql
select cron.schedule('reset-demo-society', '30 21 * * *', 'select public.reset_demo()');
```

`30 21 * * *` is 21:30 UTC, which is 03:00 in India.

## 6. Run it

```bash
npm run dev        # http://localhost:3000
```

Then check each part:
- **Landing page:** `/`
- **Demo sign-in:** `/login?demo=1`
- **Resident app:** `/app`
- **Committee console:** `/admin`
- **Civic mode** (the original roads product): `/civic`

To make yourself a platform admin, which lets you read every society for support, run this in the SQL Editor:

```sql
insert into public.platform_admins (profile_id)
select id from auth.users where email = 'you@yourdomain.com';
```

## 7. Checks before every push

```bash
npm run lint
npm run typecheck
npm run build
npm run db:test    # needs a local Postgres; set PGHOST/PGUSER/PGPASSWORD if not using the default socket
```

`db:test` applies every migration to a fresh database. It then runs the security tests in `supabase/tests/`, which check that:
- residents cannot see other societies' data;
- issues cannot be closed without an "after" photo;
- the other access rules hold.

GitHub Actions runs the same checks on every pull request (`.github/workflows/ci.yml`).

## 8. Deploy (Google Cloud Run, Mumbai)

The live demo already runs on Cloud Run in `asia-south1`. Deploy from the `civicpulse/` folder:

```bash
gcloud run deploy civicpulse \
  --source . \
  --region asia-south1 \
  --set-build-env-vars NEXT_PUBLIC_SUPABASE_URL=...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...,NEXT_PUBLIC_BRAND_NAME=Sahvaas \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...,MOCK_AI=false \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=supabase-service-role:latest,DEMO_USER_PASSWORD=demo-password:latest,GEMINI_API_KEY=gemini-key:latest
```

- `NEXT_PUBLIC_*` values are baked in at build time, so they go in both `--set-build-env-vars` and `--set-env-vars`.
- Keep the real secrets in Secret Manager, not in the command line.

After deploying, add the Cloud Run URL (or your domain) to Supabase's **Site URL** and **Redirect URLs**.

> Vercel's free Hobby plan is for non-commercial use only. Use Cloud Run (above), or Vercel Pro once you are charging customers.

## Known gaps

These are not built yet; see the roadmap in `docs/PRODUCT_PLAN.md` §15.

- WhatsApp notifications and WhatsApp issue intake
- Web push and email notifications on status changes
- Maintenance billing and payments
- Vendors and AMC tracking
- Amenity booking, polls
- Guard and visitor management

Two more caveats:

- **Not yet tested against a live database:** the database rules have automated tests, but the app has not yet been run against a real Supabase project. Do a full click-through on one before showing it to a society.
- **Translations:** the Telugu and Hindi text in `lib/i18n/messages.ts` needs a native speaker's review before launch.
