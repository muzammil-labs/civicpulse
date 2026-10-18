@AGENTS.md

# Project conventions

Product context and roadmap: `../docs/PRODUCT_PLAN.md`. Setup: `../docs/SETUP.md`.

## Layout
- `app/(marketing)`: public site. `app/(auth)`: login, onboarding, setup.
- `app/app`: resident and staff app (mobile-first). `app/admin`: committee console.
- `app/civic` and `components/` (civic files): the original roads app ("civic mode"). Keep it separate from the community product.
- `lib/supabase/*`: clients. `lib/session.ts`: `requireMember()` and `requireManager()` for every private page and server action.

## Rules
- **Security lives in the database.** Every tenant table has `org_id` and row-level security. A new table needs RLS policies and tests in `supabase/tests/`, and must pass `npm run db:test`.
- Schema changes go in a new file in `supabase/migrations/`. Never edit an applied migration.
- Use the service-role client (`lib/supabase/admin.ts`) only in trusted server code, never in Client Components.
- No secrets in the browser: AI, payments and messaging calls run server-side.
- Store money as integer paise (`bigint`), never floats. Ledgers are append-only.
- All resident-facing text goes through `lib/i18n/messages.ts` (en, te, hi).
- Validate every server action input with Zod.
- No fabricated testimonials, logos or statistics anywhere in the product or marketing.
- The product name comes from `lib/brand.ts`; never hard-code it.

## Checks
`npm run lint && npm run typecheck && npm run build && npm run db:test`
