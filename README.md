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

**Rejected/redirected AI output — two examples:**

1. **The delegation strategy itself.** Deciding how to satisfy the two-model requirement was
   itself a decision Claude got redirected on. Claude's default proposal was the low-effort path:
   Claude Sonnet 5 for everything architectural, Claude Haiku 4.5 for one bounded,
   fully-automated content task — no second tool, no context-switching, nothing for the user to
   personally review. The user overrode that: instead of the safe default, they chose to open
   Cursor (running Grok 4.6) themselves and hand it two specific files
   (`SignUpForm.tsx`/`Confirmation.tsx`), then bring the actual diff back for review rather than
   let it happen automatically. That single call is why this project has a real two-tool split
   with a human directing both sides of it, instead of two tiers of the same model running
   end-to-end without a person in the loop — the user decided which part of the codebase was
   worth their own hands-on attention, reviewed what came back, and caught a real UX issue in it
   (the hero photo needed repositioning) that only showed up once they looked at the rendered
   result themselves.

2. **The hero photo.** Partway through the build, the user wanted to add a real photo of
   themselves with their trip crew to the hero background. Claude's first move was to recommend
   *against* using the actual photo as-is — it has ~20 other identifiable people in it, some
   appearing to be minors, with no consent to publish their faces on a public site. Claude's
   recommended option was cropping to just the user. The user considered it and explicitly
   overrode that recommendation: it's their own trip, their own photo, their own people, and they
   made an informed call to use it in full rather than crop it. Claude proceeded with the user's
   decision, not its own — the right call, since the privacy judgment about a group of real
   people belongs to someone who actually knows them, not to the model flagging a generic risk
   pattern.

Both of those are the same underlying shape: Claude proposing a lower-effort or more conservative
default, and the user redirecting toward the option that required more of their own judgment and
hands-on involvement — not a one-shot correct/incorrect output, but an ongoing back-and-forth
where the highest-leverage calls (what gets built by whom, what a real photo of real people
should show) stayed with the person who actually had the context to make them.

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

## What's left / known limitations

- No admin view of submissions (not required by the spec) — rows are queryable directly in the
  Supabase dashboard.
- Rate limiting is best-effort per the note above, not a hard guarantee against a determined
  attacker.
- `builderNote` in `trips.ts` still has placeholder copy — see the `TODO(Jacob)` comment.

## Round 2: eligibility enforcement (change request)

**The request:** Builders must be 16–19 on the trip's *departure date*. Collect date of birth,
require parent/guardian consent (name + email) for minors, enforce it server-side, and decide
what an ineligible applicant sees.

**The gap this surfaced:** the original form never asked *which* departure date someone was
signing up for — with 3 real cohort dates already in the data model, "16–19 on departure" is
meaningless without knowing which one. Added a departure-date selector to the form as a
prerequisite for the eligibility check to mean anything.

**What changed:**
- `Frontend/src/data/trips.ts` — each cohort now carries a machine-readable `departureDate`
  (ISO `YYYY-MM-DD`) alongside its existing display string.
- `Backend/lib/eligibility.ts` (+ mirrored `Frontend/src/lib/eligibility.ts`) — pure integer
  year/month/day math for age-on-a-given-date. Deliberately never diffs `Date` objects for the
  actual comparison, so a browser in Mountain Time and a server in UTC can't disagree near a
  boundary. `Date` objects are only used to validate that a calendar date is real (rejects Feb 30),
  constructed from explicit components so that step carries no timezone risk either.
- `Backend/lib/cohorts.ts` — server's own authoritative `tripId`+`cohortId` → departure-date
  lookup. The client sends a `cohortId`, never a date; the server looks the date up itself, so a
  forged request can't just claim a more favorable departure date.
- `Backend/lib/validate.ts` — `dateOfBirth`, `cohortId`, `guardianName`, `guardianEmail` added to
  the schema; a `superRefine` recomputes age-on-departure independently and requires guardian
  fields only when the computed age is under 18 — never trusting whether the client thought it
  needed them.
- `SignUpForm.tsx` — departure-date select, date-of-birth input, and a guardian section that
  appears only once the computed age is a minor. Ineligibility surfaces as a same-pattern inline
  field message under date of birth (consistent with every other field's error state, not a new
  dead-end screen) — and if the same birthdate would qualify for a *different* existing cohort,
  it names it right there.
- One SQL migration: `cohort_id`, `date_of_birth`, `guardian_name`, `guardian_email` added to
  `trip_signups` (nullable — pre-existing rows predate these fields; requiredness is enforced in
  application code, not a DB constraint).

**Ineligible-applicant UX, and why:** an inline message under the date-of-birth field, in the same
visual language as every other validation error, rather than a separate "sorry" page. It's the
option that's actually shippable today with no new design work, doesn't dead-end someone who
mistyped a digit, and — since it also names any other cohort they'd qualify for — turns a rejection
into a redirect where possible.

**Edge cases handled, with reproducible proof** (all run against the real Supabase-backed local
Backend, via `POST /api/signup`; not claims):

| # | Case | Expected | Result |
|---|---|---|---|
| 1 | Exactly 16 on departure (boundary) | 201, minor | ✅ 201 |
| 2 | Exactly 19 on departure (boundary) | 201, adult | ✅ 201 |
| 3 | Exactly 20 on departure — birthday *is* the departure date (the classic off-by-one) | 400 | ✅ 400 |
| 4 | One day short of 16 on departure | 400 | ✅ 400 |
| 5 | Same DOB: ineligible for cohort 2027-1 (age 15), eligible for cohort 2027-3 (age 16) | 400 then 201 | ✅ both |
| 6 | Exactly 17, guardian fields omitted | 400 (guardian required) | ✅ 400 |
| 7 | Exactly 18, no guardian fields | 201 (not required) | ✅ 201 |
| 8 | Malformed DOB string / Feb 30 / future date | 400 (×3) | ✅ 400 ×3 |
| 9 | Bypass attempt: forged extra `"departureDate"` field on an otherwise-ineligible request | 400 (forged field silently ignored — server never reads a client-supplied date) | ✅ 400 |
| 10 | XSS payload in `guardianName` for a minor | 400 (allowlist rejects outright, not escaped-and-stored) | ✅ 400 |
| 11 | Nonexistent `cohortId` | 400 | ✅ 400 |
| 12 | Leap-day (Feb 29) birthdate against a non-leap-year date, pure function | Turns N on Mar 1, not Feb 28 | ✅ confirmed |

Post-test, queried Supabase directly: **exactly 4 rows exist** for the test batch — the 4 that
should have succeeded (#1, #2, #7, #5's second half) — confirming rejections never touched
storage, not just that they returned an error while quietly inserting anyway.

**What I cut, given the 1-hour window:**
- The cohort → departure-date map is duplicated between `Frontend/src/data/trips.ts` and
  `Backend/lib/cohorts.ts` rather than shared from one source. The two projects don't share a
  package today, and building one wasn't worth the time against the actual deadline — a real
  follow-up if trip data changes often.
- No automated test file committed (no `vitest`/`jest` added under time pressure) — proof is the
  reproducible `curl` requests above plus the pure-function leap-year check, both re-runnable
  against the live Backend.
- No affirmative "I am the parent/guardian" checkbox beyond capturing name + email — the request
  defined consent operationally as those two fields, so that's what was built.
- Didn't re-run this past Cursor/a second model — see the note below.

**AI model note for Round 2:** solo Claude Sonnet 5, no handoff to a second model this round. The
age-eligibility logic has to match exactly between client and server (same boundary math, same
guardian threshold), and a model handoff mid-task would have cost more minutes on context-transfer
than it would have saved on any one file — not worth it against a hard 5:30 PM deadline.

## Round 2 availability

All times Mountain Time — let me know if a different time works better and I'll make it work:

- Thursday, Aug 13, 4:30–6:30 PM
- Friday, Aug 14, 4:30–6:30 PM
- Monday, Aug 17, 4:30–6:30 PM
- Saturday, Aug 15, any time all day
