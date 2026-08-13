# HXP Brazil: Amazon River — Trip Sign-Up Microsite

**Live site: [hxp-brazil-signup-frontend.vercel.app](https://hxp-brazil-signup-frontend.vercel.app)**

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

**Cursor, running Grok 4.6** — tasked with reworking and polishing
`Frontend/src/components/SignUpForm.tsx` and `Confirmation.tsx`: a real loading spinner on
submit, fade/slide transitions on field errors, a fix for a stale-server-error bug (the error
banner wasn't clearing on a new submit attempt if client-side validation failed first), an
`aria-live="assertive"` region for the server-error banner, and a success-checkmark animation on
the confirmation screen with keyboard focus moved to its heading for screen-reader users. Given
the fixed contract in `src/lib/types.ts` (`SignupPayload`) and `src/lib/validation.ts`
(`signupFormSchema`) up front, plus explicit "don't touch" boundaries (honeypot, validation
rules, `Backend/`), so the result couldn't drift from what the backend expects. Delegated because
this is the most iteration-heavy, visually-driven, and decoupled part of the app — the part of
the build where a fast inline-diff loop pays off more than deep cross-file reasoning does. It also
handled a small follow-up well: repositioning the hero photo's crop (`background-position`) after
a one-line "I can't see the people, just water" note — the kind of fast, low-stakes visual
iteration this split was designed for.

**Rejected/redirected AI output:** partway through the build, the user wanted to add a real photo
of themselves with their trip crew to the hero background. Claude's first move was to recommend
*against* using the actual photo as-is — it has ~20 other identifiable people in it, some
appearing to be minors, with no consent to publish their faces on a public site. Claude's
recommended option was cropping to just the user. The user considered it and explicitly overrode
that recommendation: it's their own trip, their own photo, their own people, and they made an
informed call to use it in full rather than crop it. Claude proceeded with the user's decision,
not its own — the right call, since the privacy judgment about a group of real people belongs to
someone who actually knows them, not to the model flagging a generic risk pattern. That's the
shape most of this build actually took: Claude proposing a default, the user redirecting where
their own context mattered more, and the build adjusting to match — not a one-shot correct/incorrect
output, but an ongoing back-and-forth.

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

All times Mountain Time — let me know if a different time works better and I'll make it work:

- Thursday, Aug 13, 4:30–6:30 PM
- Friday, Aug 14, 4:30–6:30 PM
- Monday, Aug 17, 4:30–6:30 PM
- Saturday, Aug 15, any time all day
