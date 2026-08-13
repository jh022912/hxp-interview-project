# HXP Brazil: Amazon River — Trip Sign-Up Microsite

A landing page + sign-up form for a fictional HXP trip to the Amazon (Pará, Brazil), built for the
HXP take-home technical assignment (Scenario #2). Inspired by the real hxp.org site (screenshots
provided with the assignment) and by a real HXP trip to Brazil I served on — not affiliated with
or endorsed by the real HXP.

## Repo structure

Two independent, self-contained projects — each deployable as its own Vercel project by pointing
that project's **Root Directory** setting at the folder:

```
Frontend/    Vite + React + TypeScript. Static site. All trip copy lives in src/data/trips.ts.
Backend/     Vercel Serverless Functions (Node/TS). One endpoint: POST /api/signup.
```

They talk to each other over plain HTTPS — the frontend calls `VITE_API_URL`, the backend only
accepts requests from `ALLOWED_ORIGIN` (CORS). Neither folder depends on the other at build time.

## Local setup

**1. Supabase** (data store)

- Create a free project at [supabase.com](https://supabase.com).
- In the SQL editor, run `Backend/supabase/schema.sql`. This creates one table, `trip_signups`,
  with Row Level Security enabled and **no policies** — only the service-role key can touch it.
- Grab the Project URL and the `service_role` key from Project Settings → API.

**2. Backend**

```bash
cd Backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IP_HASH_SALT, ALLOWED_ORIGIN
npx vercel dev --listen 3000   # first run prompts a one-time device login to Vercel
```

Run it with `npx vercel dev` directly, not `npm run dev` — there's deliberately no `dev` script in
`Backend/package.json`, since Vercel's CLI treats a `"dev": "vercel dev"` script as a recursive
self-invocation and refuses to start.

`IP_HASH_SALT` can be anything long and random: `openssl rand -hex 32`.

**3. Frontend**

```bash
cd Frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000 (or wherever Backend is running)
npm run dev
```

Open the printed localhost URL. The whole page — hero, trip details, itinerary, sign-up form,
confirmation state — is driven by the one trip object in `Frontend/src/data/trips.ts`.

## Deploying

Two Vercel projects from the same repo:

- **Backend project** — Root Directory = `Backend`. Add `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, and `ALLOWED_ORIGIN` (the Frontend's deployed
  origin, no trailing slash) as environment variables.
- **Frontend project** — Root Directory = `Frontend`. Add `VITE_API_URL` (the Backend project's
  deployed URL).
- Deploy Backend first so you have its URL for the Frontend's env var, then update Backend's
  `ALLOWED_ORIGIN` once you know the Frontend's final URL and redeploy.

## Design decisions

- **Why two Vercel projects instead of one Next.js app or a monorepo `builds` config:** Vercel's
  native per-project Root Directory setting lets each folder be a complete, independently
  buildable unit with its own `package.json` — no legacy multi-build/routes configuration to
  reason about, and it matches "put backend items in the Backend folder, frontend items in the
  Frontend folder" literally.
- **Why the trip is data, not JSX:** `src/data/trips.ts` is a typed array. Adding a second trip is
  adding one object; a `status` field per date cohort (`open` / `waitlist` / `soldOut`) already
  exists so a "the trip sold out, add a waitlist" change is a data + small UI change, not a
  rearchitecture. This is scoped to exactly what the assignment's own example change requests
  imply — nothing more speculative than that.
- **Visual identity:** terracotta/cream/charcoal palette pulled from the real hxp.org screenshots,
  a bold monospace display face (`Space Mono`, self-hosted via `@fontsource`) echoing the blocky
  "HXP." wordmark, a humanist sans (`DM Sans`) for body copy, and one handwritten accent face
  (`Caveat`) used sparingly for the tagline and the closing quote — echoing the real site's
  handwritten tagline treatment without reusing any of their actual assets or photography (which
  I don't have rights to). The hero's topographic contour-line texture is an original SVG
  (generated procedurally, see "AI Workflow" below), inspired by the faint map texture visible
  behind the real site's trip listings.
- **Personal touch slot:** `trips.ts`'s `builderNote` field and the `BuilderNote` component are a
  deliberately marked spot (see the `TODO(Jacob)` comment in `trips.ts`) to drop in a real memory
  from serving in Brazil — left as a placeholder rather than guessed at.

## AI Workflow

Two models, split by the kind of work each is suited for:

**Claude Sonnet 5 (this session, Claude Code)** — architecture and every security-sensitive
surface: the two-project/Vercel split, the Supabase schema and RLS setup, the entire `Backend/`
package (validation, sanitization, honeypot, Supabase-backed rate limiting, CORS), the design
system (tokens, fonts, the generated topo pattern), the trip content, and the landing-page
components (`Hero`, `TripDetails`, `Itinerary`, `BuilderNote`). Also wrote a functionally-complete
baseline of `SignUpForm.tsx`/`Confirmation.tsx` (validation wiring, honeypot, loading/error
states) so the app is fully working end-to-end rather than blocked on a hand-off. Chosen for this
work because it benefits from holding a lot of cross-file context at once (a validation rule
changed in one place has to stay in sync in three others) and because correctness matters more
than iteration speed for anything that touches user data or security.

**Cursor — `[FILL IN: which model you ran, e.g. GPT-5 / Claude / Composer]`** — tasked with
reworking and polishing `Frontend/src/components/SignUpForm.tsx` and `Confirmation.tsx`: visual
polish, micro-interactions (loading spinner, animated field errors), and an accessibility pass,
built against the fixed contract in `src/lib/types.ts` (`SignupPayload`) and
`src/lib/validation.ts` (`signupFormSchema`) so the result can't drift from what the backend
expects. Delegated because this is the most iteration-heavy, visually-driven, and decoupled part
of the app — the part of the build where a fast inline-diff loop pays off more than deep
cross-file reasoning does.

**Rejected/corrected AI output:** the first version of the generated topographic background
pattern (`Frontend/src/assets/topo-pattern.svg`) used a dark charcoal stroke, written on the
assumption it would sit on the light cream background sections. It was actually placed behind the
dark hero section — rendering it in the browser (not just reading the code) showed the pattern
was effectively invisible, dark-on-dark. Regenerated the same script with a light cream stroke and
higher opacity, which is what's shipped. Caught by actually looking at a screenshot rather than
trusting that "the code looks right."

## Security

Threats considered, and what's mitigated today:

| Threat | Mitigation |
|---|---|
| XSS via the free-text "why I want to come" / dietary-restrictions fields | Every other field is allowlisted by regex (can't contain `<`, `>`, `&`, quotes at all); these two are HTML-entity-escaped server-side before storage (`validator.escape`), so the data is inert even if a future feature renders it without re-escaping. |
| SQL/NoSQL injection | Supabase's client library is parameterized end-to-end; nothing is string-concatenated into a query. Structural fields are also zod-validated against a strict allowlist before they ever reach the client. |
| Spam / abuse on a public POST endpoint | Hidden honeypot field (bots that fill it get a fake success, silently dropped, never stored) + a Supabase-backed rate limit (5 submissions / hour / hashed IP). |
| Secret exposure | Supabase service-role key and the IP-hash salt live only in the Backend Vercel project's environment variables — never in a repo file, never sent to or reachable from the browser. `.env`/`.env.local` are gitignored in both projects; `.env.example` ships with empty values. |
| PII exposure | No PII in URLs, client-side console, or API responses (the success/error responses carry no submitted data back). Raw IPs are never persisted — only a salted SHA-256 hash, used solely for the rate-limit lookup. |
| Transport / browser hardening | HTTPS via Vercel; `Frontend/vercel.json` sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and HSTS. |
| CSRF | The endpoint only accepts `application/json` POSTs from an explicitly allowlisted `Origin` (no wildcard CORS); there's no cookie-based session to forge in the first place. |

**What I'd harden next with more time:**

- Move rate limiting to a dedicated store (Upstash Redis) — the current Supabase-backed check is
  durable across cold starts but doesn't stop an attacker rotating IPs.
- Add Cloudflare Turnstile if real abuse shows up in practice (deliberately left out for this
  build — honeypot + rate limit was the scoped choice for the time budget).
- Server-side structured logging/alerting on repeated validation failures from the same hash,
  which would catch a probing attacker before they succeed.
- A CSP `connect-src` currently allows `https://*.vercel.app` as a pragmatic default before the
  Backend's final URL was known — tighten this to the exact deployed Backend origin once fixed.

## What's left / known limitations

- No admin view of submissions (not required by the spec) — rows are queryable directly in the
  Supabase dashboard.
- Rate limiting is best-effort per the note above, not a hard guarantee against a determined
  attacker.
- `builderNote` in `trips.ts` still has placeholder copy — see the `TODO(Jacob)` comment.

## Round 2 availability

`[FILL IN: 2-3 time slots in the next few days for the 1-hour change-request window]`
