# Phase 3: Build Privacy-Bounded Engagement Context - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-30
**Phase:** 3-Build Privacy-Bounded Engagement Context
**Areas discussed:** Analytics destination, Signal allowlist, Browser context, Disclosure surface

---

## Analytics destination

### Where should HAOO engagement events actually go?

| Option | Description | Selected |
|--------|-------------|----------|
| Adapter now, provider later | Typed measurement module with a no-op sink; provider behind a build-time env var like the FormSubmit endpoint. Unblocks the missing-analytics-account concern; Phase 4 counts stay theoretical until activation. | ✓ |
| Plausible / Umami hosted | Cookieless hosted provider shipped now; real dashboard immediately, at the cost of a subscription and a third-party script. | |
| Cloudflare Web Analytics | Free and cookieless, but page-view oriented; custom events need Cloudflare-proxied hosting, and the site is on GitHub Pages. | |

**User's choice:** Adapter now, provider later
**Notes:** Directly answers the STATE blocker that an analytics account may be absent while the journey must still launch.

### With no provider configured, what happens to an emitted event?

| Option | Description | Selected |
|--------|-------------|----------|
| Drop silently | Validate against the allowlist, then discard. Nothing queues or grows. Browser-context flags still update. | ✓ |
| Drop, but log in dev | Same in production plus a dev console table; adds a build-mode branch. | |
| Buffer in memory for the session | Capped array for a later flush; a buffer of engagement events is the raw clickstream MEAS-03 rules out. | |

**User's choice:** Drop silently
**Notes:** —

### How should Phase 3 open the product source boundary?

| Option | Description | Selected |
|--------|-------------|----------|
| One measurement module, product source stays clean | `src/measurement/` is the only file granted storage/analytics tokens; components keep FULL_BOUNDARY and call a typed API. | ✓ |
| Grant tokens to the components that need them | Fewer layers, but privacy rules become unauditable and every component test needs storage stubs. | |

**User's choice:** One measurement module, product source stays clean
**Notes:** Follows the Phase 2 precedent of narrowing PRODUCT_SOURCE_BOUNDARY per file rather than deleting regexes.

### HAOO-specific or product-generic module?

| Option | Description | Selected |
|--------|-------------|----------|
| Generic module, product-supplied config | Module owns events/bands/allowlists; `haoo.ts` supplies the product key. Matches Phase 1 D-17 and Phase 2 D-11. | ✓ |
| HAOO-specific for now | Less abstraction, but breaks the reusable-product-shell precedent the Phase 1 tests enforce. | |

**User's choice:** Generic module, product-supplied config
**Notes:** —

---

## Signal allowlist

### What shape should an analytics event have?

| Option | Description | Selected |
|--------|-------------|----------|
| Name-only, closed union type | Fixed TypeScript union of ten literal event names, no property bag at all. Compiler enforces MEAS-02; runtime guard catches anything dynamic. | ✓ |
| Name + tightly-typed enum props | Richer Phase 4 reporting, but each prop is a place a value can widen to a string over time. | |
| Name + free property bag, validated at runtime | Flexible, but a runtime allowlist is the only guard and MEAS-02 is a hard requirement. | |

**User's choice:** Name-only, closed union type
**Notes:** —

### Should coarse form values reach analytics?

| Option | Description | Selected |
|--------|-------------|----------|
| No — analytics stays behavioral only | `qualify_submit` is a bare count; role/band/county/timeframe reach only the HAOO inbox by email. | ✓ |
| Yes — role and portfolio band only | Segment breakdown of who submits; still re-identifying with a timestamp. | |
| Yes — all four coarse bands | Richest funnel picture, highest re-identification risk on a low-volume funnel. | |

**User's choice:** No — analytics stays behavioral only
**Notes:** Phase 2 D-17/D-18 made these bands coarse specifically so Phase 3 *could* reuse them; the phase deliberately declines rather than creating a second copy of near-identifying data.

### Which campaign parameters, and how normalized?

| Option | Description | Selected |
|--------|-------------|----------|
| utm_source / utm_medium / utm_campaign, slugified | Three params; lowercase, trim, strip to `[a-z0-9-]`, cap ~32 chars, drop anything that does not survive intact. term and content excluded outright. | ✓ |
| All five standard utm params, slugified | Complete set; utm_term can carry visitor search text. | |
| Three params, closed value list | Strictest reading of MEAS-06, but every campaign needs a deploy. | |

**User's choice:** utm_source / utm_medium / utm_campaign, slugified
**Notes:** —

### What happens to campaign params in the address bar?

| Option | Description | Selected |
|--------|-------------|----------|
| Strip them from the address bar | Read once, normalize, `history.replaceState` to the clean URL — the pattern App.tsx already uses for `?contact=success`. | ✓ |
| Leave the URL untouched | Preserves the link as received, but a copied URL propagates whatever was in it. | |

**User's choice:** Strip them from the address bar
**Notes:** Requires `window.location`, currently in ALWAYS_FORBIDDEN — belongs inside the measurement module.

---

## Browser context

### What exactly should the browser remember?

| Option | Description | Selected |
|--------|-------------|----------|
| Visit band + last-seen date band + interaction flags | Three things: `first`/`returning`/`frequent` (saturating), `today`/`this-week`/`this-month`/`earlier`, and a fixed set of booleans mirroring the event names. | ✓ |
| Interaction flags only | Impossible to misuse, but loses the repeat-visit signal that distinguishes intent from general traffic. | |
| Add a first-seen date band and a session count | Richer recency, but approximates a durable visitor identity. | |

**User's choice:** Visit band + last-seen date band + interaction flags
**Notes:** Sized to exactly what Phase 4 needs to write "returning visitor, downloaded the brochure".

### Storage medium, drift, and retention?

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage, one versioned key, self-expiring | Single JSON record under `zph.haoo.ctx.v1`; schema-validated on read, discarded and rebuilt if unparseable, unknown-version, or older than ~180 days. | ✓ |
| sessionStorage | Most private, but the visit band collapses to always `first`. | |
| localStorage, no expiry | Simpler, but retains context indefinitely — hard to defend against the pending Kenya DPA review. | |

**User's choice:** localStorage, one versioned key, self-expiring
**Notes:** —

### What happens when storage is blocked?

| Option | Description | Selected |
|--------|-------------|----------|
| Fall back to in-memory for the page life | Wrapped reads/writes; visitor treated as `first` visit with no history. No caller branches on storage availability. | ✓ |
| Return an empty context and skip writes | Simplest, but flags set earlier in the same visit are lost. | |

**User's choice:** Fall back to in-memory for the page life
**Notes:** —

### Can the visitor clear the stored context?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — a clear control in the disclosure | "Clear what this page remembers" button; wipes the key, confirms via the existing `role="status"` region. | ✓ |
| No — point at browser settings | Nothing to build, but gives the privacy review nothing concrete. | |
| Defer the control to Phase 4 | Tighter phase, but MEAS-04 is the disclosure requirement and this is its natural home. | |

**User's choice:** Yes — a clear control in the disclosure
**Notes:** Answers the pending Kenya Data Protection Act concern in STATE with something actionable.

---

## Disclosure surface

### Where should the disclosure live?

| Option | Description | Selected |
|--------|-------------|----------|
| Expandable block in the `#qualify` section | Visible one-liner near submit plus an expander holding the full detail and the clear control. No new route. | ✓ |
| Dedicated section on the HAOO page | More discoverable, but separates disclosure from consent and adds a nav item competing with conversion. | |
| Site-wide privacy page | Most conventional and best for legal review, but a new static route and site-wide scope expansion. | |

**User's choice:** Expandable block in the `#qualify` section
**Notes:** This is the "expandable what-we-collect list" Phase 2 explicitly deferred to Phase 3.

### Reachable from anywhere else?

| Option | Description | Selected |
|--------|-------------|----------|
| Also a footer link that jumps to it | "How we measure this page" anchors to the block and opens it expanded. | ✓ |
| Qualification section only | Tightest scope, but a brochure-only visitor is measured without passing the notice. | |

**User's choice:** Also a footer link that jumps to it
**Notes:** —

### How to handle the Phase 2 "In future…" wording?

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite to present tense, re-approve at a checkpoint | Draft corrected wording, hold a blocking human checkpoint before shipping — the protocol used for the county codepoints and the response-time sentence. | ✓ |
| Rewrite without a checkpoint | Faster, but silently supersedes wording a human explicitly approved. | |
| Leave it until Phase 4 | Literally accurate until the summary ships, but the milestone audit already flags the gap. | |

**User's choice:** Rewrite to present tense, re-approve at a checkpoint
**Notes:** Constraint recorded in CONTEXT.md D-16 — the summary itself ships in Phase 4, so the rewrite must describe what is true after Phase 3 and must not create a new promise-versus-payload gap.

### How specific should the expanded disclosure be?

| Option | Description | Selected |
|--------|-------------|----------|
| Name every signal explicitly | Ten plain-language lines plus the three stored items and a matching "never collected" list; test-bound to the closed allowlist. | ✓ |
| Describe categories, not individual signals | Shorter and ages better, but cannot be test-bound and drifts invisibly. | |

**User's choice:** Name every signal explicitly
**Notes:** —

---

## Claude's Discretion

No decisions were explicitly delegated. Downstream agents retain discretion over module file layout, function and type names, band threshold constants and the expiry window, test structure, expander markup and styling, footer link placement, and copy wording — subject to the D-16 blocking checkpoint for the collection notice.

## Deferred Ideas

- Site-wide `/privacy/` route — revisit after the Kenya Data Protection Act review.
- Dedicated `#privacy` section with its own nav entry — rejected in D-13.
- Segment analytics on role and portfolio band — rejected in D-06 for v1.
- Dev-mode console logging of emitted events — left out to keep the no-op sink inert.
- Engagement summary in the qualification email — Phase 4 (MEAS-05).
