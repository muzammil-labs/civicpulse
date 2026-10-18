# Product Plan: CivicPulse becomes a community operating system for gated communities

> **Status:** Plan v1, 18 Oct 2026. Nothing in this document has been built yet.
> **Launch market:** Gated communities, apartment associations and RWAs in Hyderabad, Telangana.
> **Secondary product:** Civic and road issue reporting is kept as a separate interface, called "Civic mode".
> **Working name:** CivicPulse. The new name is still to be chosen (see §2).

Prices, limits and regulations below were checked in October 2026. Anything marked **[verify]** comes from secondary sources, or could change before you act on it. Confirm those on the official page first. This document is not legal, tax or financial advice. Have a chartered accountant (CA) and a lawyer review §9 and §12 before you collect any money.

---

## Table of contents

1. [Where you are today (honest audit)](#1-where-you-are-today-honest-audit)
2. [New name and positioning](#2-new-name-and-positioning)
3. [Market, competitors and your wedge](#3-market-competitors-and-your-wedge)
4. [The complete product: every module](#4-the-complete-product-every-module)
5. [Users, roles and permissions](#5-users-roles-and-permissions)
6. [Architecture and tech stack](#6-architecture-and-tech-stack)
7. [Database design](#7-database-design)
8. [Authentication and security](#8-authentication-and-security)
9. [Payments: your revenue and society maintenance collection](#9-payments-your-revenue-and-society-maintenance-collection)
10. [AI, WhatsApp and notifications at near-zero cost](#10-ai-whatsapp-and-notifications-at-near-zero-cost)
11. [Running free demos without losing money](#11-running-free-demos-without-losing-money)
12. [Legal and compliance checklist (India)](#12-legal-and-compliance-checklist-india)
13. [UI/UX system](#13-uiux-system)
14. [Engineering workflow, testing and operations](#14-engineering-workflow-testing-and-operations)
15. [Build roadmap, phase by phase](#15-build-roadmap-phase-by-phase)
16. [Pricing and business model](#16-pricing-and-business-model)
17. [Go-to-market playbook for Hyderabad](#17-go-to-market-playbook-for-hyderabad)
18. [Metrics that matter](#18-metrics-that-matter)
19. [Risks and how to handle them](#19-risks-and-how-to-handle-them)
20. [Your first 14 days](#20-your-first-14-days)
21. [Sources](#21-sources)

---

## 1. Where you are today (honest audit)

You have two separate codebases that have drifted apart:

| | `CivicPulse_v10.html` (single file, about 555 KB) | `civicpulse/` Next.js app (this repo) |
|---|---|---|
| Positioning | Already pivoted to gated communities and RWAs | Still about civic and road issues (hackathon build) |
| Pages | 23 hash-routed pages: home, communities, pricing, dashboard preview, onboarding, scan, login and signup, civic pages, legal pages | Home, map, dashboard, for-cities, about, `/api/analyze` |
| Data | Everything in `localStorage` | Everything in `localStorage` via `ReportProvider` |
| AI | Calls the Anthropic API **from the browser** using a key the user pastes in | Server-side Gemini 4-step chain, already has a `MOCK_AI` mode |
| Auth | Fake: users and passwords stored as **plain text** in `localStorage` (`cp_users_v1`) | None |
| i18n | English, Hindi and Telugu | English only |

**What is worth keeping**
- The pivot messaging ("End the WhatsApp group chaos"), the before/after slider, the committee queue mock-up, the pricing structure and the three-language support in v10. This copy is good.
- The server-side Gemini pipeline in `civicpulse/app/api/analyze/route.ts`: classification, duplicate check, severity, bounding boxes, streaming and `MOCK_AI`. This is real engineering, and it carries over to community issues.
- The map components, which will power Civic mode.

**What must go before any real customer sees it.** These are not style notes. Each one is a legal or trust problem.
1. **Made-up testimonials and statistics.** Examples: "Vikram Rao, Prestige Sunrise Enclave", "Meera Krishnan, Palm Meadows", "Trusted by RWAs across India", the hard-coded `reportCount = 1240` and "City deployments". Publishing fake testimonials is misleading advertising under India's Consumer Protection Act, 2019. RWA committees in the same area also talk to each other, so one discovered fake costs you the whole corridor. Replace them with real pilot quotes later, or with no quotes at all.
2. **"CivicPulse Technologies Pvt. Ltd." in the footer.** Don't name a company until it is incorporated.
3. **API key in the browser** (`anthropic-dangerous-direct-browser-access`). All AI calls move to the server.
4. **Plain-text passwords in localStorage.** Replace them with real authentication (§8).
5. **Two diverging codebases.** Pick one. **Recommendation:** rebuild on the Next.js app, keeping v10 as the visual and copy reference. The single HTML file cannot grow into multi-tenant SaaS.

---

## 2. New name and positioning

### Positioning statement
> **[Name] is the operating system for gated communities. Residents report and pay in seconds, from WhatsApp or the app. Committees get a clear queue, proof that work was done, and books ready for the AGM.**

The core promise is about **resolution and transparency**, not gate security. Gate and visitor management is where the big incumbents are strongest (§3).

### Name shortlist
Choose a name that is short, easy to say in Telugu, Hindi, Urdu and English, works as a `.in` or `.com` domain, and does not lock you into "civic".

| Name | Meaning or idea | Pros | Cons |
|---|---|---|---|
| **Aangan** | "Courtyard", the shared heart of an Indian home (Hindi and Urdu) | Warm and familiar; fits "community" | Common word, so a trademark is harder to get and the domain may be taken |
| **Sahvaas** | "Living together" (Sanskrit-derived) | Distinctive and easier to trademark | Must be explained once |
| **Commonwise** | Shared spaces, managed wisely | Clear in English; good for selling to facility management companies | Less local warmth |
| **Gatewise** | Says the category immediately | Instantly understood | Sounds like a security or gate product, which is the wrong signal |
| **Padosi** | "Neighbour" | Friendly and memorable | Likely heavily used already |

**Recommendation:** shortlist **Sahvaas** and **Aangan**, then pick the first that clears every check below. Keep **"CivicPulse"** as the name of Civic mode ("CivicPulse by Sahvaas"), so the hackathon recognition is not lost.

**Name checks before committing.** I have not verified availability for any of these names.
1. IP India trademark search (ipindia.gov.in) in Class 9 (software), Class 42 (SaaS) and Class 36 (real-estate and property management services).
2. MCA company-name availability, if you incorporate.
3. Domain: `.in` and `.com` (and `.app` as a fallback).
4. Play Store and App Store names, Instagram, LinkedIn and X handles, and a WhatsApp Business display name (Meta reviews display names).
5. Say the name aloud to 5 people who speak Telugu and 5 who speak Hindi or Urdu, to catch accidental meanings.

---

## 3. Market, competitors and your wedge

### Competitors
- **MyGate, NoBrokerHood, ADDA (formerly ApnaComplex)**, plus many smaller apps. They bundle gate and visitor management, maintenance billing, a helpdesk and a community feed.
- **Pricing (unverified):** blog comparisons put them at roughly **₹3–15 per flat per month**, and MyGate does not publish society pricing. Most of these comparison blogs are written by vendors selling competing software, so treat the range as rough and get real quotes from committees you meet.
- **How they earn:** subscriptions, convenience fees on maintenance payments, and in some cases ads or marketplace services to residents.

### Your wedge: do not start by cloning MyGate
Fighting incumbents on gate security means hardware, guard training and 24/7 support, where they are strongest. Win where they are weakest and where your work already shines:

1. **Issue resolution with proof.** AI triage of photos, voice notes and text in Telugu, Hindi and English, a duplicate merge ("Tower B lift: 7 reports merged into 1"), service-level deadlines (SLAs), and a ticket that cannot close without an "after" photo. Residents see live status, so nobody needs to ask "any update?".
2. **WhatsApp-native intake.** A resident sends a photo to the society's WhatsApp number and a ticket is created. No app to install. Replies within the 24-hour window are free (§10).
3. **Transparent money.** Maintenance billing, online collection that settles **directly into the society's bank account**, plus expense tracking, so the treasurer has AGM-ready reports. Treasurers become your champions.
4. **Committee handover continuity.** Committees change after every election. Every decision, vendor contract and AMC (annual maintenance contract) date stays in the system, which makes you sticky.

Gate and visitor management arrives in Phase 3, once you have paying societies that ask for it.

### Hyderabad focus
Gated-community demand is concentrated in western corridors such as Gachibowli, Kokapet, Narsingi, Tellapur, Kollur, Kondapur, Nallagandla and Bachupally. That claim comes from developer marketing blogs, so read it as a hint, not data. Start in **one or two adjacent corridors**, so word of mouth compounds and on-site visits stay cheap.

---

## 4. The complete product: every module

Each feature is tagged with its phase: **P1** = pilot MVP, **P2** = paid launch, **P3** = scale, **P4** = later.

### 4.1 Resident app (PWA first, store apps later)
| Feature | Phase |
|---|---|
| Join with an invite link or QR code, phone OTP, claim a flat, committee approves (owner or tenant) | P1 |
| Raise an issue: photo, voice or text; AI suggests category, location (tower, floor, common area) and urgency; resident confirms | P1 |
| "Me too" on an existing issue instead of a duplicate (duplicate detection) | P1 |
| Live status timeline (Open → Assigned → In progress → Resolved, with an "after" photo) and a rating when closed | P1 |
| Notices and circulars with read receipts; urgent alerts (water cut, lift shutdown) | P1 |
| Language switch: English, Telugu, Hindi (Urdu later) | P1 |
| Raise issues and get updates through WhatsApp | P2 |
| My dues, pay online (UPI, card, netbanking), receipts, payment history | P2 |
| Amenity booking (clubhouse, courts, party hall) with rules, fees and cancellations | P2 |
| Polls and surveys; documents (bylaws, AGM minutes, audited accounts) | P2 |
| Opt-in resident directory and emergency contacts | P2 |
| Visitor pre-approval, delivery passes, daily-help (maid, driver) attendance | P3 |
| SOS button to security and committee | P3 |
| Move-in and move-out workflow (NOC, tenant verification checklist) | P3 |

### 4.2 Committee and admin console (web, desktop-first, works on mobile)
| Feature | Phase |
|---|---|
| Issue queue in Kanban and table views, with filters (tower, category, SLA breach, assignee) | P1 |
| Assign to staff or vendor; merge or split duplicates; internal notes; bulk actions | P1 |
| SLA rules per category (for example, lift: 4 hours; plumbing: 24 hours) with automatic escalation | P1 |
| Society setup: towers, floors, units, CSV import of residents, roles | P1 |
| Dashboard: open, overdue, average resolution time, top categories, satisfaction | P1 |
| Broadcast notices across channels (push, email, WhatsApp) | P1 |
| Maintenance billing: per-sq-ft or flat-rate charges, one-off levies, late fees, GST where applicable (§12) | P2 |
| Collections: online plus offline (cash, cheque, direct UPI with reference-number capture); reconciliation | P2 |
| Expenses and vendor payments, budgets against actuals, monthly income and expenditure | P2 |
| Vendor registry, AMC contracts with renewal reminders, preventive maintenance calendar (lifts, generator, STP, WTP, fire systems, pumps) | P2 |
| Asset register with QR stickers on assets, so scanning a pump opens its history | P2 |
| Polls and elections, meeting minutes, resolutions log | P2 |
| AGM report generator (PDF) and exports to Excel and Tally-compatible formats | P2–P3 |
| Audit log of every admin action (who changed what, and when) | P1 (built in from day 1) |
| Facility-management company console: one login across many societies | P3 |
| AI committee assistant ("What's overdue in Tower B?", "Draft the water-cut notice in Telugu") | P3 |

### 4.3 Staff and vendor app
| Feature | Phase |
|---|---|
| My jobs list, accept and start, "before" and "after" photos required to close, checklists | P1 (simple) → P2 |
| Preventive-maintenance tasks from the calendar | P2 |
| Attendance and shift check-in (facility staff) | P3 |
| Spares and inventory usage | P4 |

### 4.4 Guard app (Phase 3: Android, offline-capable)
Visitor entry with photo and approval request to the resident, delivery logging, cab and guest pre-approvals, daily-help entry, patrol checkpoints using QR codes, and an emergency broadcast.

### 4.5 Platform operations (only you)
Tenant list and health, subscription and billing status, feature flags per society, a support inbox, audited "view as admin" (impersonation that is logged and time-limited), usage and cost metering (AI calls and WhatsApp messages per society), and demo-tenant reset.

### 4.6 Civic mode (kept as a separate interface)
- Separate route group and subdomain (for example, `civic.<brand>.in`) with its own look, reusing the same backend, auth and AI pipeline.
- Public issue map, ward-wise view, and institution tenants (schools, hospitals, campuses) as a **separate organisation type**.
- **Bridge feature:** a community issue that lies outside the gate (road, streetlight or garbage just outside) can be published to the civic map with one tap. It can also be packaged as a ready-to-file complaint for the official GHMC or utility grievance channels. Don't claim a direct government integration unless you have one.

---

## 5. Users, roles and permissions

| Role | Scope | Can |
|---|---|---|
| `platform_admin` | Everything | You and future staff. Every action audited. |
| `org_admin` | One society | President, secretary or treasurer: settings, members, finance, roles |
| `committee` | One society | Manage issues, notices, polls; read finance (configurable) |
| `finance` | One society | Billing, collections, expenses (treasurer or accountant) |
| `facility_manager` | One or more societies | Operational issue and vendor management, no finance write |
| `staff` / `vendor` | Assigned jobs only | Update assigned tickets, upload proof |
| `guard` | One gate or society | Visitor flows (P3) |
| `resident_owner` / `resident_tenant` | Their unit(s) | Own tickets, community notices, own dues |

Rules:
- One person can hold different roles in different societies through the `memberships` table.
- Tenants never see owners' dues. Residents never see other residents' phone numbers unless both opt in.
- Committee members are elected and change. Roles are granted and revoked in-app, with an audit trail, never by sharing passwords.

---

## 6. Architecture and tech stack

Goals: a solo founder can build it, demos cost ₹0, and costs grow only when revenue does.

| Layer | Choice | Why | Cost to start |
|---|---|---|---|
| Frontend + server | **Next.js (existing, v16) + TypeScript + Tailwind v4 + shadcn/ui** (already in repo) | You already know it; server actions and route handlers keep secrets server-side | Free |
| Database | **Supabase Postgres** in the **Mumbai (ap-south-1)** region | Postgres, auth, storage, realtime and row-level security (RLS, enforced inside the database) in one service | Free tier for dev and demo; **Pro about $25/month** at the first paying customer [verify] |
| Auth | **Supabase Auth**: phone OTP for residents, email magic link or Google for committee members | Built in; Auth Hooks let you plug in an Indian SMS or WhatsApp OTP provider | Free; OTP is pay-per-message |
| File storage | Supabase Storage (start) → **Cloudflare R2** for photos at scale | R2: 10 GB free and **zero egress fees** | Free |
| Hosting | **Google Cloud Run, asia-south1 (Mumbai)**, which you already use | Generous free tier; India region; container-based, so no lock-in | About ₹0 at pilot scale [verify] |
| Background jobs | Supabase `pg_cron` + Postgres-based job queue (e.g., `pgmq`) or Cloud Scheduler hitting signed endpoints | Reminders, SLA checks, invoice generation, nightly backups | Free |
| AI | **Gemini Flash-Lite / Flash** (existing code) behind one internal `ai` module with provider fallback | Cheap vision model; keep it swappable | Free tier for demos; pay-per-use for production (§10) |
| WhatsApp | **Meta WhatsApp Cloud API directly**, or a business solution provider (BSP) charging at cost | Lowest per-message cost | Pay-per-use |
| Email | Resend or Amazon SES | Transactional mail | Free tier [verify] |
| Payments | **Razorpay** (primary), Cashfree (backup) | Indian UPI, cards, autopay, sub-merchant onboarding (§9) | No setup fee; % per transaction |
| Monitoring | Sentry (errors), Better Stack or UptimeRobot (uptime), PostHog (product analytics) | All have free tiers | Free |

**Hosting note:** Vercel's Hobby plan is **for non-commercial use only**, and a paid SaaS is commercial. Either stay on Cloud Run (recommended) or move to Vercel Pro (about $20/month per seat [verify]) once you have revenue. Check Netlify's free-tier terms before using it in production.

### Application structure (single Next.js app, route groups)
```
apps/web (the current civicpulse/ folder, renamed later)
├── app/
│   ├── (marketing)/        # Landing, pricing, demo booking: ported from v10 HTML
│   ├── (resident)/app/     # Resident PWA
│   ├── (admin)/admin/      # Committee console
│   ├── (staff)/work/       # Staff and vendor jobs
│   ├── (civic)/civic/      # Civic mode: separate layout and branding
│   ├── (ops)/ops/          # Platform admin (you)
│   └── api/
│       ├── ai/…            # AI triage (moved from /api/analyze)
│       ├── webhooks/razorpay
│       ├── webhooks/whatsapp
│       └── cron/…          # Signed, idempotent job endpoints
├── lib/
│   ├── db/                 # Supabase clients (server, browser) and generated types
│   ├── auth/               # Session and role helpers
│   ├── ai/                 # Provider-agnostic AI module, prompt registry, cost meter
│   ├── payments/           # Razorpay adapter, ledger posting, reconciliation
│   ├── notify/             # Channel router: push, email, WhatsApp, SMS
│   └── i18n/               # en, te, hi message catalogs
└── supabase/
    ├── migrations/         # All schema changes as SQL, version-controlled
    ├── seed.sql            # Demo tenant data
    └── tests/              # RLS tests (pgTAP)
```

**Why one app instead of microservices:** you are one person. A modular monolith keeps clear boundaries between `lib/` modules and can be split later if needed.

---

## 7. Database design

Multi-tenant on a **shared schema**. Every tenant-owned row carries `org_id`, and **row-level security (RLS) is enabled on every table**. The database itself refuses cross-society reads, even if application code has a bug.

### Core tables (simplified)
```
orgs                (id, type: society|city|institution|fm_company, name, slug, city, plan, status, settings jsonb, created_at)
org_links           (parent_org_id, child_org_id)          -- FM company → societies
blocks              (id, org_id, name)                      -- towers or phases
units               (id, org_id, block_id, number, floor, area_sqft, type)
profiles            (id = auth.users.id, full_name, phone, email, locale, avatar_path)
memberships         (id, org_id, profile_id, role, status: pending|active|revoked, created_by, created_at)
unit_occupancies    (id, unit_id, profile_id, relation: owner|tenant|family, from_date, to_date)

-- Helpdesk
issue_categories    (id, org_id, key, label_i18n jsonb, default_sla_minutes, default_assignee_id)
issues              (id, org_id, unit_id?, location_text, block_id?, category_id, title, description,
                     urgency, status, assignee_id?, vendor_id?, sla_due_at, duplicate_of?, source: app|whatsapp|staff,
                     ai_meta jsonb, created_by, created_at, resolved_at)
issue_events        (id, issue_id, org_id, actor_id, type, payload jsonb, created_at)   -- append-only timeline
issue_media         (id, issue_id, org_id, kind: before|after|attachment, storage_path, sha256, created_at)
issue_followers     (issue_id, profile_id)                  -- "me too" and notifications

-- Community
notices, notice_reads, polls, poll_options, poll_votes (one per unit or member, as the bylaws say),
documents, amenities, amenity_bookings

-- Operations
vendors, vendor_contracts (AMC, start/end, renewal_reminder_days), assets, maintenance_schedules, maintenance_tasks

-- Finance (P2): double-entry, never update balances in place
ledger_accounts     (id, org_id, code, name, type: asset|liability|income|expense|equity)
journal_entries     (id, org_id, date, memo, source_type, source_id, created_by)
journal_lines       (id, entry_id, org_id, account_id, unit_id?, debit_paise, credit_paise)   -- integer paise only
charge_rules        (id, org_id, name, basis: per_sqft|flat|per_unit_type, amount_paise, frequency, gst_applicable)
invoices            (id, org_id, unit_id, period, number, total_paise, due_date, status)
invoice_lines, payments (id, org_id, invoice_id?, method, gateway, gateway_payment_id UNIQUE, amount_paise, status, raw jsonb)
receipts, expenses, payouts

-- Your SaaS billing
subscriptions       (id, org_id, plan, units_billed, period_start, period_end, status, gateway_ref)
saas_invoices       (id, org_id, number, gst_number?, amount_paise, tax_paise, status, pdf_path)

-- Platform
audit_log           (id, org_id?, actor_id, action, target_type, target_id, before jsonb, after jsonb, ip, created_at)
usage_counters      (org_id, period, ai_calls, whatsapp_msgs, sms_otps, storage_bytes)
webhook_events      (id, provider, event_id UNIQUE, payload, processed_at)   -- idempotency
consents            (id, profile_id, purpose, notice_version, granted_at, withdrawn_at)    -- DPDP
```

### Rules that prevent the classic failures
- **Money is stored as integer paise** (`bigint`), never as floats.
- **Ledgers are append-only.** Corrections are reversal entries, never edits. Each journal entry must balance (debits equal credits), enforced by a database constraint or trigger.
- **Unique `gateway_payment_id` and unique `webhook_events.event_id`**, so a payment can never be recorded twice even if Razorpay retries a webhook.
- **`issue_events` is append-only** and serves as the status history and audit trail.
- **Soft delete** (`deleted_at`) for user-facing records, plus hard-delete jobs to honour DPDP erasure requests and retention periods.
- **Indexes** on `(org_id, status, created_at)` for queues and `(org_id, unit_id)` for finance.
- **The service-role key is used only in server code**, for webhooks and cron jobs, and every such call sets `org_id` explicitly.

---

## 8. Authentication and security

### Authentication flows
| User | Method | Notes |
|---|---|---|
| Resident | Phone + OTP (WhatsApp OTP first, SMS fallback) | WhatsApp authentication templates cost about **₹0.115 + GST**, against roughly **₹0.15–0.25 per SMS OTP** [verify both] |
| Committee | Email magic link or Google sign-in, **plus a second factor (TOTP authenticator app) for finance and admin roles** | Finance roles must use 2FA |
| Staff and vendor | Phone OTP, limited role | Can be invited by the committee |
| Joining a society | Invite link or QR code → OTP → claim flat → committee approves | Prevents strangers joining; CSV import pre-links phones to flats so approval can be automatic |

OTP abuse controls: rate limits per phone and per IP, a 30–60 second resend cooldown, a maximum of 5 attempts, and CAPTCHA (Cloudflare Turnstile, free) after repeated failures. Otherwise bots can drain your OTP budget ("SMS pumping").

### Security checklist (build it in, don't bolt it on)
- [ ] RLS enabled on **every** table, with automated tests proving that a resident of society A cannot read society B (pgTAP tests in CI).
- [ ] No secrets in the browser. All AI, payment and WhatsApp calls happen server-side. Keys live in Cloud Run secrets or Secret Manager, never in git (`.env*` is already gitignored).
- [ ] Input validation with Zod on every server action and route handler.
- [ ] File uploads: type and size checks, re-encode images server-side, **strip EXIF GPS data**, store under private buckets, serve through short-lived signed URLs.
- [ ] Webhook signature verification (Razorpay HMAC, Meta `X-Hub-Signature-256`) **before** parsing the payload.
- [ ] Security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'` (except the embed pages you choose).
- [ ] Rate limiting on auth, AI and public endpoints (Postgres-backed or Upstash Redis free tier).
- [ ] Audit log for every admin and finance action; impersonation always logged and time-limited.
- [ ] Backups: Supabase Pro daily backups **plus** your own nightly `pg_dump`, encrypted, to R2, with a **restore drill once a month**. Backups you have never restored don't count.
- [ ] Dependencies: Dependabot or Renovate, `npm audit` in CI, lockfile committed.
- [ ] Accounts: 2FA on GitHub, Google Cloud, Supabase, Razorpay, Meta Business, domain registrar and email. Losing one of these accounts is a bigger risk than most code bugs.
- [ ] A written incident response plan: who is notified, within how many hours, and the template message (DPDP breach-notification duties, §12).
- [ ] Before the paid launch: run the OWASP ASVS Level 1 checklist yourself, and get a professional penetration test before you hold a meaningful amount of payment data.

---

## 9. Payments: your revenue and society maintenance collection

These are **two separate money flows**. Keep them separate in code, accounts and contracts.

### 9.1 Flow A: societies pay you (SaaS subscription)
- **Billing:** annual upfront by default (committees prefer one approval per year), monthly as an option. Price per unit (§16) with a monthly minimum.
- **How they pay:** GST-compliant invoice PDF plus a Razorpay Payment Link (UPI, netbanking, card) or direct NEFT/UPI to your current account. Use Razorpay Subscriptions or UPI Autopay only for monthly payers.
- **UPI Autopay rules:** RBI allows recurring UPI debits **without extra authentication up to ₹15,000 per transaction**, and requires a **pre-debit notification** before each debit. Card mandates suit larger amounts. Razorpay's published standard rate is **2% + GST for UPI and cards**; NACH and e-mandate pricing is "on request" [verify; negotiate once you have volume].
- **What happens when a society doesn't pay:**
  - Day 0: reminders.
  - Day 15: in-app banner for admins.
  - Day 30: **read-only mode**. Residents can still raise issues and view history; admin features are paused.
  - Never delete data. Exports always remain available. This is fair, and it protects your reputation.
- **Refund policy:** pro-rata refund on annual plans within the first 30 days, then no refund but cancellation at the end of the term. Write this into the Terms.
- **Founding-customer offer:** see §16.

### 9.2 Flow B: residents pay their society (maintenance, levies, amenity fees)
This is the most valuable feature, and the one with the most regulatory risk. The safe design:

**Never route residents' money through your own bank account.** Under RBI's Payment Aggregator rules (updated directions finalised in September 2025), an entity that collects funds and later passes them on to merchants is a payment aggregator, which needs RBI authorisation, an escrow account and capital requirements. A startup cannot realistically take that on.

**Do this instead:**
1. **Each society becomes its own merchant** with Razorpay or Cashfree. The society completes KYC (PAN, registration certificate, bank account, authorised signatory). Money settles **directly into the society's bank account**.
2. You onboard societies through the payment gateway's **partner or platform programme** (Razorpay Partners, or Cashfree's equivalent), which lets your platform create and link sub-merchant accounts by API and may pay you a revenue share. Confirm which product fits and its eligibility (Razorpay Route's documentation links eligibility to the 2025 PA directions and a turnover test) **in writing with the gateway** before building. [verify]
3. **Zero-fee option, always available:** show the society's own UPI ID or QR code. The resident pays directly and enters the UPI reference number (UTR); the treasurer confirms or bulk-matches it against a bank statement upload (CSV). Many committees will want this to avoid gateway fees.
4. **Fees:** UPI payments use the society's negotiated rate. For cards, let the society choose to absorb the fee or pass it on as a convenience fee shown before payment, per the gateway's rules and your Terms.
5. **Your income from Flow B:** partner revenue share or a separate platform fee in your SaaS plan. **Do not skim the money in transit.**

### 9.3 Payment engineering
- **State machine:** `created → pending → authorized → captured → settled`, plus `failed`, `refunded` and `disputed`. Every transition is an `issue_events`-style append-only row.
- **Webhooks are the source of truth.** The browser "success" page only shows "processing…". Order: verify signature → insert `webhook_events` (a unique `event_id` makes retries no-ops) → post journal entries in one database transaction.
- **Daily reconciliation job:** pull the gateway's settlements report, match it against `payments`, and flag mismatches in the ops dashboard.
- **Receipts:** numbered per society and per financial year, immutable, PDF plus a WhatsApp or email copy.
- **Testing:** use Razorpay test mode end to end; write tests for duplicate webhooks, out-of-order webhooks and a partial refund.

### 9.4 GST on maintenance (needed so your billing logic is correct)
Per CBIC Circular 109/28/2019, an RWA must charge GST (18%) on maintenance **only if both** of these hold: (a) a member's contribution is **more than ₹7,500 per month per flat**, and (b) the RWA's annual turnover is **₹20 lakh or more**. Whether GST applies to the full amount or only the excess over ₹7,500 has been disputed (the circular says the full amount; at least one advance ruling said only the excess). Make this a **per-society setting, decided by the society's CA**. Your software computes; it doesn't decide. [verify current position]

---

## 10. AI, WhatsApp and notifications at near-zero cost

### 10.1 AI (issue triage, translation, summaries)
- **Keep your existing Gemini pipeline**, moved behind `lib/ai` with one interface: `triageIssue(image?, text?, locale)` returns `{ category, location hint, urgency, title, description in the resident's language, possible duplicates }`.
- **Cost controls:**
  - Resize images in the browser to about 1024 px and JPEG quality ~0.7 before upload. This cuts tokens and storage sharply.
  - Use the cheapest capable model first (Flash-Lite), and escalate to Flash only when confidence is low.
  - Skip AI when the resident picks a category manually. AI is a helper, not a gate.
  - Cache results by image hash, so the same photo is never analysed twice.
  - Set a monthly AI quota per society and per plan, metered in `usage_counters`.
  - Find duplicates with **plain SQL first** (same category plus same block plus open within 72 hours plus distance or location match). Use AI only as a tie-breaker.
- **Free tier vs paid:** the Gemini API free tier is fine for development and demos, but the limits changed several times in 2025–26; sources put Flash-Lite at roughly 100–1,000 requests per day [verify in AI Studio]. **Important for privacy:** Google's terms have said content sent to the *unpaid* tier may be used to improve its products. Use the **paid tier for real resident data** [verify current terms]. At pilot scale, paid AI cost per society is likely only tens of rupees a month. Measure it with the usage meter instead of guessing.

### 10.2 WhatsApp (the channel that wins Indian residents)
India rates from Meta, effective 1 January 2026, per message [verify on Meta's rate card; Meta can change rates quarterly]:
- **Marketing:** about ₹0.86. **Avoid it.** You don't need marketing messages.
- **Utility** (ticket updates, dues reminders): about ₹0.115, and **free inside an open 24-hour customer-service window**.
- **Authentication (OTP):** about ₹0.115.
- **Service replies within 24 hours of the resident's last message:** **free**.
- Add 18% GST, and any business solution provider's markup if you use one.

Design to stay inside the free window:
- Residents **start** the conversation ("Hi" or a photo to the society number). Your bot replies and creates tickets for free within that window.
- Status updates that land inside the 24-hour window cost nothing. Outside it, send one utility template.
- Bundle updates into a single daily digest instead of five separate messages.

Example budget: a 300-flat society with about 600 paid utility messages a month costs about 600 × ₹0.115 × 1.18 ≈ **₹81/month**.

**One number or many?** Start with **one platform WhatsApp number**, with the society name in every message. Offer a society's own branded number in a higher tier later. Each number needs its own Meta Business verification.

### 10.3 Notification router
Channel priority per message type: **in-app plus web push (free)** → **email (free tier)** → **WhatsApp (paid, only for things residents truly want)** → SMS (last resort). Residents choose their preferences, with sensible defaults. Every send is recorded for debugging and cost tracking.

Web push works on Android browsers, and on iOS 16.4+ when the PWA is added to the home screen.

---

## 11. Running free demos without losing money

1. **A permanent demo society** ("Sunrise Enclave (Demo)") with realistic seeded data: 3 towers, 240 units, 60 issues across all states, notices, dues and a vendor list. It is reset **every night** by a cron job from `supabase/seed.sql`.
2. **Demo logins without OTP:** one-click "Try as Resident", "Try as Committee" and "Try as Staff" buttons that sign into fixed demo accounts. No SMS or WhatsApp is ever sent from the demo tenant (blocked in the notification router).
3. **AI in demos:** use **cached responses** for the 10 sample photos you show in every demo, and the existing `MOCK_AI=true` path as a safety net. For "try your own photo", use the free tier with a per-IP daily cap and a graceful fallback ("AI is busy, pick a category").
4. **Payments in demos:** Razorpay **test mode** only. Label it clearly ("Test payment, no money moves").
5. **Pilot societies:** they get a real tenant on the free tier of every service. Your cost per pilot is close to ₹0 until you send WhatsApp messages, about ₹50–100/month per society.

**Monthly running cost by stage (estimates; verify current prices):**
| Stage | What's running | Approx. cost |
|---|---|---|
| Building + demos | Supabase Free, Cloud Run free tier, Gemini free tier, R2 free, Resend free | **₹0** + domain (about ₹700–1,500/year) |
| 1–5 pilot or paid societies | Supabase Pro ($25), Cloud Run (~$0–10), WhatsApp pay-per-use, Gemini paid | **≈ ₹2,500–4,000/month**, covered by one paying 300-flat society |
| 20–50 societies | Larger Supabase compute, Sentry or PostHog paid tiers if exceeded | ≈ ₹8,000–20,000/month, against ₹40,000–1,50,000/month in revenue |

---

## 12. Legal and compliance checklist (India)

**This is a checklist to discuss with a CA and lawyer, not legal advice.**

- [ ] **Business entity.** A sole proprietorship is fastest to start. A **Private Limited company** is better for raising money and for contracts with societies; an LLP is in between. Consider **DPIIT Startup India recognition** once incorporated.
- [ ] **GST registration.** The threshold for services is generally ₹20 lakh turnover. Many RWAs are not GST-registered and cannot claim input tax credit, so your 18% GST is a real cost to them. Ask your CA whether to register voluntarily now or at the threshold.
- [ ] **Current account** in the business's name, separate from personal money from day one.
- [ ] **Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025** (notified November 2025, with obligations phased in):
  - Consent-manager provisions start about 12 months after notification (around November 2026).
  - **Most data-fiduciary obligations start about 18 months after notification (around mid-May 2027).** These cover notice, security safeguards, breach notification, children's data, grievance redressal and penalties. Exact dates differ by source by one day [verify against the Gazette].
  - You are building now, so **design for full compliance from day one**:
    - [ ] Itemised privacy notice in plain English, Telugu and Hindi
    - [ ] Consent records (`consents` table) with easy withdrawal
    - [ ] Purpose limitation; collect only what you need (no Aadhaar numbers; vehicle numbers only if gate management needs them)
    - [ ] Retention schedule and deletion jobs
    - [ ] Grievance contact published
    - [ ] Breach notification procedure to affected people and the Data Protection Board
    - [ ] **Data Processing Agreement** with each society. Usually the society decides why resident data is collected and you process it on its behalf, but **have your lawyer confirm the roles**, because you also act on your own account (your billing, analytics).
    - [ ] Children's data: avoid collecting it. Family members under 18 should be listed only as names by the adult, if at all.
- [ ] **Terms of Service, Privacy Policy, Refund Policy, Acceptable Use Policy.** Payment gateways require refund and contact pages before activating your account.
- [ ] **Society-side legal basics:** in Telangana, associations commonly register under the **Telangana Societies Registration Act, 2001** (some use the co-operative route; apartment ownership itself falls under the Telangana Apartments (Promotion of Construction and Ownership) Act, 1987 [verify current status]). For payments, the society needs its own PAN and bank account. **Sign contracts with the registered association, not an individual committee member.**
- [ ] **Advertising honesty:** no fabricated testimonials, logos or statistics (Consumer Protection Act, 2019). Use real pilot results with written permission.
- [ ] **WhatsApp Business policy:** an opt-in record for each resident, no promotional spam, and an opt-out keyword.
- [ ] **SMS DLT registration** (TRAI rules for commercial SMS in India) if you send SMS. WhatsApp-first OTP reduces your dependence on it.
- [ ] **Trademark filing** for your chosen name (see §2).

---

## 13. UI/UX system

### Principles
1. **A resident gets an issue in within 3 taps or 15 seconds**: photo → confirm the AI suggestion → submit.
2. **The committee sees "what needs me today" first.** Overdue and urgent items come first; everything else is one click away.
3. **Trust through visible proof:** before and after photos, timestamps, who did what.
4. **Bilingual by default:** Telugu, Hindi and English everywhere, including WhatsApp templates and PDFs.
5. **Works on a ₹10,000 Android phone on 4G:** a fast first page load, offline drafts, and image compression before upload.

### Design system
- **Base:** shadcn/ui (already set up, `radix-nova` style) on Tailwind v4, with your own design tokens (colour, radius, spacing, typography) defined once in `globals.css`.
- **Typography:** Inter or Geist for Latin; **Noto Sans Telugu** and **Noto Sans Devanagari** for the Indic languages. Test line heights; Telugu needs more vertical space.
- **Colour:** one confident brand colour plus semantic colours for status (open, in progress, resolved, overdue). Never rely on colour alone; always pair it with an icon or label. Meet WCAG AA contrast in light and dark modes.
- **Components to build early:** IssueCard, StatusTimeline, KanbanColumn, DataTable (filter, sort, bulk select), PhotoCompare (before/after slider; reuse the v10 idea), AmountInput (₹ formatting in lakh/crore style), EmptyState, Skeleton, Toast, Sheet (mobile bottom sheet), LanguageSwitcher.
- **Motion:** Framer Motion (already installed) only for state changes such as status moves and confirmations. Respect `prefers-reduced-motion`.
- **PWA:** manifest, icons, offline shell, an install prompt shown after the first successful report (not on first visit), and web push.

### Key screens to design first (in Figma, or directly in code from the v10 visuals)
Resident: Home (my issues plus notices plus dues), Report issue (camera-first), Issue detail (timeline), Pay dues, Notices.
Committee: Today queue, Issue detail with assignment, Society setup wizard, Members, Notices composer, Monthly report.
Staff: My jobs, Job detail with required "after" photo.

### UX validation
Before building each Phase 1 screen, watch 5 real residents (including at least 2 people over 55) and 3 committee members use a clickable prototype. Fix what confuses them.

---

## 14. Engineering workflow, testing and operations

- **Repo:** one repo, `main` protected; branch → pull request → CI → merge. Conventional commit messages.
- **Environments:** `local` (Supabase CLI running in Docker), `staging` (a free Supabase project plus a Cloud Run service with the demo tenant), `production` (Supabase Pro, Mumbai).
- **CI (GitHub Actions):** typecheck → lint → unit tests (Vitest) → RLS tests (pgTAP via the Supabase CLI) → build → Playwright end-to-end smoke tests (sign in, raise issue, assign, resolve, pay in test mode).
- **Migrations:** only through `supabase/migrations/*.sql` committed to git. Never edit production schema by hand. Generate TypeScript types from the schema in CI.
- **Feature flags:** a `settings` jsonb per org plus a platform flag table. Ship dark, enable per society.
- **Observability:** Sentry with release tags, structured logs carrying `org_id` and `request_id`, uptime checks on `/api/health`, and alerts for webhook failures and reconciliation mismatches.
- **Support:** an in-app "Help" button that opens a WhatsApp chat with you, a status page, and a public changelog.
- **Working with Claude Code:** keep `CLAUDE.md` updated with these conventions (RLS mandatory, money in paise, no secrets client-side, i18n for all strings). Have each feature built from a short spec plus acceptance tests.

---

## 15. Build roadmap, phase by phase

Timelines assume you working roughly full-time with AI coding assistance. Adjust honestly. "Done" means it works for a real society, not just in a demo.

### Phase 0: Foundations (weeks 1–2)
- [ ] Choose the name, buy domains, reserve handles; decide sole proprietorship, LLP or Pvt Ltd (§12).
- [ ] Remove the fake testimonials and stats from all public pages.
- [ ] Restructure the Next.js app into route groups (§6); port the v10 marketing pages to React with the new name.
- [ ] Supabase project (Mumbai), migrations folder, base schema (orgs, units, profiles, memberships, audit_log), RLS plus pgTAP tests.
- [ ] Auth: phone OTP through a WhatsApp or SMS hook, email magic link for admins, role helpers.
- [ ] CI pipeline, Sentry, staging environment, demo-tenant seed and nightly reset.
- [ ] Design tokens and the core components (§13).
**Exit criterion:** you can create a society, import 50 units from CSV, invite a resident who joins by OTP, and RLS tests prove isolation between societies.

### Phase 1: Pilot MVP (weeks 3–8)
- [ ] Resident: raise issue (camera, voice, text; AI triage; "me too"), status timeline, notices, language switch, PWA plus push.
- [ ] Committee: today queue (Kanban and table), assign, merge duplicates, SLA rules and escalations, notices composer, basic dashboard, audit log view.
- [ ] Staff: my jobs plus a required "after" photo.
- [ ] Notification router: push plus email plus WhatsApp utility templates (submit templates for Meta approval early; approval takes time).
- [ ] Platform ops: tenant list, usage meter, impersonation with audit.
- [ ] Privacy notice, Terms and consent capture (DPDP-ready).
**Exit criterion:** 3 pilot societies live, with 30%+ of households joined and 70%+ of issues resolved within SLA.

### Phase 2: Paid launch (weeks 9–16)
- [ ] WhatsApp inbound bot: photo → ticket, status replies, inside the free 24-hour window.
- [ ] Finance: charge rules, invoice generation, online collection (society as merchant, §9.2), offline UTR matching, receipts, double-entry ledger, expenses, income and expenditure report, defaulter list with polite reminders.
- [ ] Vendors and AMC contracts with renewal alerts, preventive-maintenance calendar, asset QR codes.
- [ ] Amenity booking, polls, documents.
- [ ] Your SaaS billing (§9.1) and a self-serve plan page.
- [ ] Monthly committee PDF report and AGM pack.
**Exit criterion:** 10 paying societies, 2 of them collecting maintenance online, and zero reconciliation errors for 30 days.

### Phase 3: Scale and defend (months 5–8)
- [ ] Guard app (Android via Capacitor or Expo, offline-first): visitors, deliveries, daily help, pre-approvals.
- [ ] Facility-management company console (many societies, one login), which becomes your sales channel.
- [ ] Tally export and an accountant-friendly view.
- [ ] Store apps (Play Store first), deep links from WhatsApp.
- [ ] Civic mode refresh: the community-to-civic bridge, ward map, institution tenants.
- [ ] AI committee assistant and an auto-drafted monthly summary.
- [ ] Penetration test and a DPDP compliance review ahead of the mid-May 2027 deadline.
**Exit criterion:** 50 societies, net revenue retention ≥ 100%, monthly churn < 2%.

### Phase 4: Expand (months 9–18)
Second city (Bengaluru or Pune), a vetted vendor marketplace (only with clear rules and no hidden commissions), predictive maintenance from asset history, builder-handover packages, and an Urdu interface.

---

## 16. Pricing and business model

Your v10 pricing (Free up to 50 homes; Pro ₹2,999/month up to 300 homes; Max ₹7,999/month) is a reasonable start. Per-unit pricing scales better and is how committees think ("how much per flat?"). **Proposed:**

| Plan | Price (excl. GST) | Includes |
|---|---|---|
| **Free** | ₹0, up to 50 units | Helpdesk (app plus web), notices, 30 AI triages/month, email and push only |
| **Community** | **₹6/unit/month**, minimum ₹1,200/month | Everything in Free, unlimited AI triage, SLA and escalations, staff app, WhatsApp updates (fair-use quota), polls, documents, amenity booking, monthly report |
| **Community + Finance** | **₹10/unit/month**, minimum ₹2,500/month | Everything in Community, plus billing, online and offline collections, ledger and expenses, AGM pack, vendors and AMC, priority support |
| **Township / FM company** | Custom | Multiple societies, branded WhatsApp number, guard app, SSO, onboarding on site |

- **Annual billing gets 2 months free** (pay for 10 of 12). Annual billing is your default.
- **Founding-society offer** (first 10 societies in Hyderabad): **3 months free**, then **50% off for year 1**, in exchange for a written testimonial, a case study with real numbers, and 2 introductions to nearby committees.
- **Unit economics example:** a 300-flat society on Community + Finance pays ₹3,000/month. Its direct costs (WhatsApp, AI, storage) are likely under ₹300/month, a **90%+ gross margin** before support time [estimate; measure it with the usage meter].
- **Later revenue:** payment-partner revenue share on online collections (§9.2), FM-company licences, and premium add-ons (guard app, branded WhatsApp number, extra storage).
- **Price testing:** quote these prices in your first 10 sales conversations and track objections. Be ready to adjust within ₹4–12/unit. Blogs place competitors at roughly ₹3–15/flat/month (unverified), so these prices are in a defensible band if the product clearly wins on resolution and transparency.

---

## 17. Go-to-market playbook for Hyderabad

**Who decides:** the managing committee, usually the President, Secretary and Treasurer. Decisions often wait for a monthly committee meeting, so plan for a **3–8 week sales cycle**. The champion is usually the most overworked person: often the secretary for issues, or the treasurer for money.

**Channels, in order of priority**
1. **Your own network and corridor saturation.** Pick 1–2 corridors (for example, Gachibowli–Nallagandla–Tellapur). Visit societies in person with a 10-minute demo on a tablet and the before/after slider.
2. **Facility-management companies** that run housekeeping and maintenance for many gated communities. One FM partner can bring 10–30 societies. Offer them the multi-society console free while they bring paying societies.
3. **Builder handover moments.** New projects hand over to resident associations every month in western Hyderabad. Offer builders a free "handover kit": units pre-loaded and vendors and AMC contracts imported.
4. **RWA federations and resident forums**, LinkedIn posts from committee members who use you, and local Telugu and English community groups.
5. **Content:** practical guides ("How to run a transparent AGM", "GST on maintenance explained", "Lift AMC checklist") in English and Telugu. These rank well and build trust with treasurers.

**Pilot playbook (per society)**
- Week 0: a 30-minute call with the committee; set 3 success metrics (for example, average resolution time, the share of issues raised outside WhatsApp, and residents onboarded).
- Week 1: import units, set up categories and SLAs, onboard staff, put QR posters at lifts and the clubhouse, and send a WhatsApp onboarding message through the committee.
- Weeks 2–6: a weekly 15-minute review with the champion; fix friction fast.
- Week 6: show a before/after metrics report → convert to paid with the founding offer.

**Sales materials:** a one-page PDF in English and Telugu, a 2-minute demo video, a sample monthly report, a Data Processing Agreement, and a pricing sheet.

---

## 18. Metrics that matter

| Area | Metric | Target (first 6 months) |
|---|---|---|
| Activation | % of households joined within 30 days of launch | ≥ 40% |
| Engagement | Weekly active residents / joined residents | ≥ 25% |
| Core value | Median time to resolution; % resolved within SLA | Down 50% vs the baseline; ≥ 75% |
| Committee | Weekly active committee members per society | ≥ 2 |
| Money (P2) | % of dues collected through the platform; on-time collection rate | ≥ 50%; up 10 points vs baseline |
| Business | Pilot → paid conversion; monthly churn; net revenue retention | ≥ 60%; < 2%; ≥ 100% |
| Cost | Direct cost per society per month | < 10% of the plan's price |
| Quality | Crash-free sessions; p95 page load on 4G | ≥ 99.5%; < 2.5 s |

---

## 19. Risks and how to handle them

| Risk | Mitigation |
|---|---|
| Incumbents bundle a "free helpdesk" | Win on resolution quality, WhatsApp intake, Telugu UX and finance transparency; FM-company channel; switching help (data import) |
| Committee changes after elections and the new committee cancels | Contract with the registered association; keep resident adoption high so cancelling is unpopular; history and handover reports as lock-in value |
| Payment regulation (§9.2) | Society-as-merchant model only; written confirmation from the gateway; never hold funds |
| DPDP non-compliance by May 2027 | Build compliance in now (§12); review in Phase 3 |
| WhatsApp price or policy changes | Notification router with push and email fallbacks; stay in the free service window; measure cost per society |
| AI free-tier cuts or price rises | Provider-agnostic `lib/ai`; manual category fallback; caching; AI is never required to submit |
| Solo founder bandwidth | Ruthless phase scope; automated tests; one corridor at a time; hire a part-time customer-success person at about 15 societies |
| A data breach | RLS plus tests, least privilege, 2FA on everything, backups plus restore drills, an incident plan |

---

## 20. Your first 14 days

1. **Day 1–2:** shortlist 3 names, run the checks in §2, buy the domain. Decide the entity type with a CA.
2. **Day 2:** remove fabricated testimonials, stats and the company name from anything public.
3. **Day 3–4:** call or visit **5 committee members** in your target corridor. Ask what they use now, what breaks, what they pay, and who decides. Write down the exact words they use.
4. **Day 4–6:** restructure the repo (§6), set up Supabase (Mumbai), base schema plus RLS tests, CI.
5. **Day 7–9:** auth (OTP plus magic link), society creation, CSV unit import, invite flow.
6. **Day 10–12:** issue reporting end to end (resident → committee queue → staff → resolved with photo) using the existing AI pipeline moved server-side.
7. **Day 13:** demo tenant plus seed plus nightly reset; one-click demo logins.
8. **Day 14:** show it to the 5 committee members from Day 3. Sign up **2–3 pilots**.

---

## 21. Sources

Checked October 2026. Secondary sources are marked; confirm on the official pages before you rely on them.

- Competitor pricing (vendor-written blogs, unverified): [Codingclave: Best society management app India 2026](https://codingclave.com/blog/best-society-management-app-india-2026), [Codingclave: MyGate alternatives 2026](https://codingclave.com/blog/mygate-alternatives-india-2026), [Codingclave: Society app guide](https://codingclave.com/blog/society-management-app-guide)
- DPDP Rules 2025: [PIB document (Nov 2025)](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf), [Hogan Lovells summary](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-)
- WhatsApp Business pricing, India 2026 (secondary): [Authkey](https://authkey.io/blogs/?p=1840), [Monty Mobile](https://montymobile.com/blogs/whatsapp-business-api-pricing-in-india-inr-rates-gst-and-the-2026-currency-migration-deadline), [Baat.ai](https://baat.ai/blog/whatsapp-api-pricing-india), [Hyperleap calculator](https://hyperleap.ai/whatsapp-pricing-calculator-india)
- Razorpay pricing and UPI Autopay: [Razorpay pricing explained](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/), [UPI Autopay vs card e-mandates](https://razorpay.com/blog/upi-autopay-vs-card-e-mandates/), [Razorpay Route docs](https://razorpay.com/docs/payments/route/)
- RBI Payment Aggregator rules: [Outlook Money on the 2025 directions](https://outlookmoney.com/banking/payment-aggregator-guidelines-rbi-issues-new-directions-for-payment-aggregators), [Khaitan & Co. on the 2020 guidelines](https://khaitanco.com/thought-leaderships/RBI-issues-guidelines-to-regulate-payment-aggregators)
- GST on RWA maintenance: [CBIC Circular 109/28/2019-GST](https://cbic-gst.gov.in/pdf/circular-cgst-109n.pdf), [Taxscan summary](https://www.taxscan.in/top-stories/gst-on-rwa-maintenance-charges-threshold-exemption-itc-rules-1448115)
- Supabase free tier (secondary): [Jetadmin 2026 guide](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [Makerkit](https://makerkit.dev/blog/saas/supabase-pricing)
- Gemini API free tier (secondary, conflicting): [agentdeals: pricing changes](https://agentdeals.dev/gemini-api-pricing-changes), [Yingtu guide](https://yingtu.ai/en/blog/google-gemini-api-free-tier)
- Vercel Hobby non-commercial rule: [Vercel fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines), [Hobby plan docs](https://vercel.com/docs/plans/hobby)
- SMS OTP pricing (secondary): [Authgear comparison](https://www.authgear.com/post/best-otp-service-providers/), [Message Central](https://www.messagecentral.com/blog/sms-otp-pricing-india)
- Cloudflare R2 free tier: [Cloudflare developer platform](https://www.cloudflare.com/lp/pg-developer-platform-multi-sku/), [flarecalc R2](https://flarecalc.com/calculators/r2)
- Hyderabad gated-community corridors (developer marketing, indicative only): [Sobha: best areas](https://www.sobha.com/blog/best-areas-gated-community-apartments-hyderabad/)
- Telangana Societies Registration Act, 2001: [India Code, Act 35 of 2001](https://www.indiacode.nic.in/bitstream/123456789/8705/1/act_35_of_2001.pdf)
