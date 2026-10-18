# Sahvaas (working name), with CivicPulse as its civic mode

An operating system for gated communities, starting in Hyderabad:
- Residents report issues with a photo, in English, Telugu or Hindi.
- The committee gets one prioritised queue with deadlines.
- Staff close each job with an "after" photo as proof.
- Everyone affected sees what happened.

The original **CivicPulse** road and civic reporting app (built for the Vibe2Ship 2026 hackathon) lives on as a separate **civic mode** at `/civic`.

- **Product plan:** [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md) covers market, features, architecture, security, payments, pricing, go-to-market and roadmap.
- **Setup and deploy:** [`docs/SETUP.md`](docs/SETUP.md)

## What's built

| Area | Where |
|---|---|
| Marketing site: landing, pricing, demo booking, draft privacy notice and terms | `civicpulse/app/(marketing)` |
| Sign-in (mobile OTP, email link, one-click demo accounts), create or join a society | `civicpulse/app/(auth)` |
| Resident app: report with photo and AI suggestion, "me too", timeline, rating, notices | `civicpulse/app/app` |
| Committee console: queue and stats, assign, merge, close with proof, members and invites, setup, notices | `civicpulse/app/admin` |
| AI triage (Gemini Flash-Lite, free keyword fallback, metered per society) | `civicpulse/app/api/ai/triage`, `civicpulse/lib/ai` |
| Database: multi-tenant schema, row-level security, demo society, security tests | `civicpulse/supabase` |
| Civic mode (original hackathon app) | `civicpulse/app/civic` |

## Stack

Next.js 16 · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, Storage) in Mumbai · Gemini · Google Cloud Run (asia-south1)

## Quick start

```bash
cd civicpulse
cp .env.example .env.local   # fill in Supabase keys
npm install
npm run demo:setup           # demo accounts + sample society
npm run dev
```

## Developer

Mohammed Muzammil · [github.com/muzammil-labs/civicpulse](https://github.com/muzammil-labs/civicpulse)
