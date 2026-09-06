# Requirements: ZERO-PAPER HUB Product Launch Platform

**Defined:** 2026-08-29
**Core Value:** A serious HAOO prospect can understand the product, demonstrate intent, and reach the right onboarding path quickly without getting lost in general company traffic.

## v1 Requirements

### Product Discovery

- [x] **PROD-01**: Visitor can discover HAOO from a Products section on the ZERO-PAPER HUB home page
- [x] **PROD-02**: Visitor can open the stable HAOO product URL on the HAOO production domain (`https://www.haoo.online/`) directly or from the ZERO-PAPER HUB Products section, and a visitor arriving at the retired `https://www.zero-paperhub.com/products/haoo/` path is still carried to it by the published recovery document. *Mechanism named honestly: a client-side zero-second meta refresh plus `rel="canonical"`, because GitHub Pages emits no per-path server redirect — the only real 301 option, a CDN in front of Pages, was considered and scoped out (D-12, RESEARCH Pitfall 3). Amended by Phase 04.2; supersedes the `/products/haoo/` wording. The four brochure assets under the retired path are NOT retained — see QUAL-04 — so no retention period is claimed for them.*
- [x] **PROD-03**: Visitor can understand HAOO's audiences, benefits, capabilities, and rental journey through responsive semantic web content derived from the supplied brochure
- [x] **PROD-04**: Visitor can preview the original HAOO PDF brochure and can always open or download it through explicit controls
- [x] **PROD-05**: Visitor sees HAOO-specific page title, description, canonical URL, and social-sharing metadata on the HAOO site's own published document. *Amended by Phase 04.2 so the claim attaches to whatever document path the split settles (recorded in `04.2-SPLIT-CONTRACT.md` § Published document path) rather than to the retired `/products/haoo/` page. Strength unchanged.*
- [x] **PROD-06**: HAOO content and contact details are sourced from centralized product data — the product shell sources carry no product-name literal, and every product fact the shell renders is read from the product definition. *Successor claim per D-05, amended by Phase 04.2.* **WITHDRAWN HALF, named rather than deleted:** the original requirement also claimed the collection *demonstrates reuse across more than one product without duplicating the page shell*. That half is **withdrawn** by Phase 04.2 — after the split the HAOO repository holds exactly one product, so reuse across products is no longer provable there and cannot be restored without a second product. The successor above is what stays both true and enforceable. The in-code half of this withdrawal lands in **plan 04.2-02**, in the same commit that makes the shell single-product.

### Onboarding Paths

- [x] **ONBD-01**: Prospect can contact HAOO through a visible click-to-call link for `+254 702 188 044`
- [x] **ONBD-02**: Prospect can start a WhatsApp conversation with HAOO through a visible link using non-personal generic starter text
- [x] **ONBD-03**: Prospect can email `info@haoo.online` through a visible mail link
- [x] **ONBD-04**: Prospect can self-onboard through a visible link to `manage.haoo.online`
- [x] **ONBD-05**: Assisted and self-service onboarding paths remain available regardless of analytics, browser storage, PDF embedding, or form-provider availability

### Qualification and Delivery

- [ ] **LEAD-01**: Interested visitor can submit their name and at least one usable contact method through a HAOO-specific qualification form
- [ ] **LEAD-02**: Interested visitor can identify their role, organization, portfolio-size band, location, and intended onboarding timeframe using clear controlled fields
- [ ] **LEAD-03**: Visitor can see which qualification fields are required, why the information is collected, and that relevant HAOO engagement context accompanies the submission
- [ ] **LEAD-04**: A valid HAOO qualification submission is addressed to `info@haoo.online` with a recognizable HAOO-specific subject and human-readable field labels
- [ ] **LEAD-05**: Visitor receives accessible validation, submitting, success, failure, and retry guidance without losing entered values after a recoverable error
- [ ] **LEAD-06**: Qualification form applies a honeypot and provider-supported spam controls without creating a barrier for legitimate keyboard or assistive-technology users
- [ ] **LEAD-07**: Release verification proves the HAOO form endpoint is activated and a uniquely tagged production submission reaches the HAOO inbox or spam folder

### Privacy-First Measurement

- [ ] **MEAS-01**: Product owner can view aggregate counts for HAOO page views, brochure preview/open/download actions, qualification starts/submits, assisted-contact clicks, and self-onboarding clicks
- [x] **MEAS-02**: Analytics events use a closed allowlist and contain no names, contact details, free-text form values, exact portfolio/location values, or stable visitor identifiers
- [x] **MEAS-03**: Browser stores at most bounded visit bands, coarse date bands, and HAOO interaction flags without a UUID, raw clickstream, or cross-site identity
- [x] **MEAS-04**: Visitor can read a privacy disclosure describing aggregate analytics, bounded browser context, and the engagement summary attached after voluntary form submission
- [x] **MEAS-05**: Submitted qualification email includes a disclosed human-readable summary of relevant HAOO engagement signals without an opaque lead score
- [x] **MEAS-06**: Campaign parameters are allowlisted and normalized before use and never include or receive personal information
- [x] **MEAS-07**: Product journey remains fully functional when analytics scripts or browser storage are blocked or unavailable
- [ ] **MEAS-08**: Reports describe browser-observable events truthfully as views, attempts, and outbound clicks rather than confirmed delivery, customers, or completed onboarding

*Status note 2026-09-02 (Phase 4 gap closure): plans 04-08 and 04-09 close the two code-level
blockers named in `04-VERIFICATION.md` — the analytics script was accepting an unapproved origin,
and provider initialization did not fail closed on an unproven automatic-capture opt-out. Closing
those two paths is necessary but not sufficient. MEAS-01 additionally requires production privacy
approval of the processor, creation of the exact ten dashboard goals, and live confirmation that
each explicit action emits one name-only event with no automatic duplicate; all three are deferred
human gates that no executor can perform or assert. MEAS-08 additionally requires live report
reconciliation — running the documented command against the approved site and key and comparing the
7/30/90/all-time counts and dates against the raw provider dashboard. Separately, the MVP outcome
and privacy readability judgment at 320px and 200% zoom with keyboard and screen-reader use is a
human gate covering the generated report, the privacy disclosure, and the maximum-context
engagement summary. No MEAS-01 or MEAS-08 box may be checked until `/gsd-verify-work 04` confirms
the code-level closure and the named human gates above are cleared. MEAS-05 is checked on the
verifier's recorded `MEAS-05 ✓ SATISFIED` finding together with roadmap success criterion 2
recorded as verified; it is the only status promoted by these gap-closure plans.*

*Amended 2026-09-01 (Phase 4 planning): `redirect returns` was removed from MEAS-08. The Phase 3
closed event allowlist in `src/products/haoo.ts:14-25` contains no redirect-return event, and no
Phase 4 plan may add one — the allowlist is locked. Enumerating a label category the measurement
layer cannot emit would require the report to either fabricate the row or ship a permanently empty
one. The remaining categories (views, attempts, outbound clicks) are unchanged, and the precision
intent — never claiming confirmed delivery, customers, or completed onboarding — is preserved in
full.*

*Status note 2026-09-03 (Phase 04.1 measurement migration): the measurement provider was replaced
end to end. This changes which MEAS-01 gates apply, and the change is recorded here rather than
performed silently. **Processor privacy approval is re-opened** — the new processor is a different
company, in a different region (the United States), with a different retention posture, and the
previous approval is not inherited. **The ten-dashboard-goals gate is retired by design, not
waived** — the migrated report submits a single aggregate that counts raw event names grouped by
name, so no dashboard goal has to exist for any of the ten names and no activity can be
permanently omitted by a goal created late; the gate is retired because the mechanism it protected
no longer exists. **The one-action-one-event gate is kept and strengthened** — it now additionally
confirms that no automatic page-view or interaction event accompanies each action and that no
person profile was created, because the new provider's own defaults are precisely what would
produce the duplicate that check exists to catch, and it is also the only check that confirms
ingestion accepts a payload reduced to three transport properties. **The MEAS-08 live
reconciliation gate is re-pointed** at the new provider and its documented command, and it is now
also where the inclusive-boundary behaviour of the submitted query is confirmed, since this
repository can assert the exact query text it sends but not the provider's evaluation of it. One
gate is new: **suppressing server-side geo-IP enrichment is an owner-performed project setting the
code cannot assert** — the client-side option for it is documented by the vendor as having no
effect, and the only in-code alternative would add a property to the payload and break the
bare-name contract; declining it is a decision that forces both a payload change and an amendment
to the visitor disclosure, and is costed as such rather than absorbed as a caveat. All five gates
are written up in `04.1-USER-SETUP.md` under this migration's phase directory. **No box is checked
and no status cell is changed by this note.** The code-level closure this migration delivers is
necessary but not sufficient: MEAS-01 and MEAS-08 stay unchecked and `Gaps Found` until the gates
above are cleared and recorded. No data migration is required or should be planned — the previous
provider was never activated in production, so all-time counts simply begin at first ingestion.*

*Status note 2026-09-05 (Phase 04.1 plan 04.1-11, delivery enabled): the privacy owner recorded the
re-opened processor approval — verbatim answer `approved`, taken before any variable that enables
delivery was set — and the deploy workflow now supplies `VITE_HAOO_MEASUREMENT_PROVIDER`,
`VITE_HAOO_POSTHOG_TOKEN` and `VITE_HAOO_POSTHOG_API_HOST` to the build as public repository
variables. **No box is checked and no status cell is changed by this note.** Deployment-level
closure is necessary and not sufficient, exactly as the 2026-09-02 and 2026-09-03 notes above
already say of code-level closure. What deployment bought is that seven previously blocked UAT
checkpoints became **performable**, not that any of them passed. MEAS-01 still needs the live
one-action-one-event confirmation — exactly one event per action, the allowlisted bare name, no
automatic `$pageview`/`$pageleave`/`$autocapture`/`$rageclick`/`$web_vitals`/`$exception` alongside
it, and no person profile created — which is also the only check that confirms PostHog Cloud US
**accepts** a payload reduced to three transport properties; a silent ingestion rejection would read
as a dead funnel rather than a broken one. MEAS-08 still needs the live report reconciliation
against the approved project, which is also where the provider's evaluation of the query's inclusive
day bounds is settled. One further owner step is outstanding and is not a gate this repository can
observe: the three repository variables above must actually be **created** in GitHub Actions. The
workflow reads them; it cannot create them, and an absent variable expands to the empty string and
fails the selector closed to `none`. A green workflow run is therefore not evidence of a capturing
deploy. MEAS-01 and MEAS-08 stay unchecked and `Gaps Found`.*


### Experience and Release Quality

- [ ] **QUAL-01**: Visitor can use the Products and HAOO journeys at supported mobile and desktop widths without horizontal overflow or hidden primary actions
- [ ] **QUAL-02**: Visitor can navigate product content, brochure controls, form fields, validation messages, and onboarding links by keyboard with visible focus
- [ ] **QUAL-03**: HAOO page preserves semantic heading order, descriptive link and control names, zoom support, reduced-motion behavior, and an HTML equivalent for brochure information
- [x] **QUAL-04**: Direct navigation and browser refresh work for the HAOO document and the published brochure asset on the HAOO production host `www.haoo.online`, both served as physical files. **Retired-path asset disposition, stated explicitly (RESEARCH Pitfall 6 gap, closed by Phase 04.2):** the four assets formerly published under `https://www.zero-paperhub.com/products/haoo/` — `HAOO-Marketing-Brochure.pdf`, `brochure-preview.png`, `haoo-hero.png`, `haoo-logo.png` — are **not copied into and not retained by ZERO-PAPER HUB; those URLs 404 after cutover.** This is an accepted, recorded cost, not an oversight: a static host emits no per-path redirect, so an already-published brochure URL either resolves or 404s. Only the retired *page* keeps a recovery document (D-12); the retired *asset files* do not. *Amended by Phase 04.2; host re-pointed to the `www` leg 2026-09-06 when the owner reversed decision (a).*
- [ ] **QUAL-05**: Build, typecheck, lint, automated contract/component tests, and required deployed manual checks pass before launch
- [x] **QUAL-06**: Published HAOO claims, phone number, email address, and onboarding URL match the supplied brochure source material

### Repository and Domain Separation

- [x] **SPLT-01**: HAOO builds, tests, and deploys from a repository that ships no ZERO-PAPER HUB product source, and ZERO-PAPER HUB from one that ships no HAOO product source, with neither suite reading a file the other owns — measured as CONTENT OWNERSHIP, not string occurrence: no tracked path is shared outside the ratified 26-entry scaffold allowlist, no ratified divergent-content collision has converged, no ZERO-PAPER HUB product source carries HAOO product source, and no HAOO source names a home-page symbol
- [x] **SPLT-02**: Every published HAOO URL and asset path — canonical, social metadata, brochure PDF and preview, and `noscript` recovery links — resolves on the HAOO production domain, and a visitor arriving at the retired `/products/haoo/` path still reaches the HAOO page
- [x] **SPLT-03**: Measurement build variables, the approved ingestion origin, and the report credentials are configured in the HAOO repository only, and a ZERO-PAPER HUB build carries no measurement code, ingestion origin, or credential shape
- [x] **SPLT-04**: Visitor-facing relationship, data-controller, and measurement-disclosure statements are true of HAOO as a standalone domain

## v2 Requirements

### Lead Operations

- **LEAD-08**: Team can search, filter, assign, and update qualified prospects in a durable leads list or selected CRM
- **LEAD-09**: Qualified prospect submissions can create or update CRM records through an approved server-side integration
- **LEAD-10**: Team can automate follow-up workflows after lead ownership, retention, and service-level rules are defined

### Attribution

- **MEAS-09**: Team can reconcile website self-onboarding clicks with aggregate completed registrations provided by the HAOO application
- **MEAS-10**: Team can run controlled funnel experiments after a trustworthy baseline and minimum sample policy exist

### Commercial Expansion

- **ONBD-06**: Prospect can compare HAOO subscription plans after pricing and packaging are approved
- **PROD-07**: Tenant and agent audiences can enter dedicated acquisition funnels after decision-maker onboarding is validated

## Out of Scope

| Feature | Reason |
|---------|--------|
| Building or changing the HAOO application | This milestone markets HAOO and routes visitors to the existing platform |
| Searchable lead database or dashboard in v1 | User chose email-only delivery until a leads list or CRM is selected |
| Advertising pixels, remarketing, fingerprinting, or cross-site profiling | Conflicts with the approved privacy-first measurement strategy |
| Predictive lead scoring or automatic prospect rejection | No validated sales data or transparent decision policy exists |
| Checkout or subscription purchase on ZERO-PAPER HUB | HAOO pricing and commercial packaging are not yet defined |
| Embedded HAOO account creation | Self-onboarding remains owned by `manage.haoo.online` |
| PDF-only product experience | Responsive semantic HTML is the primary accessible experience |
| Server-side secrets in the static website | GitHub Pages serves all bundled values publicly |

## Traceability

Traceability is populated during roadmap creation. Every v1 requirement must map to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROD-01 | Phase 1 | Complete |
| PROD-02 | Phase 04.2 | Complete |
| PROD-03 | Phase 1 | Complete |
| PROD-04 | Phase 1 | Complete |
| PROD-05 | Phase 04.2 | Complete |
| PROD-06 | Phase 04.2 | Complete |
| ONBD-01 | Phase 1 | Complete |
| ONBD-02 | Phase 1 | Complete |
| ONBD-03 | Phase 1 | Complete |
| ONBD-04 | Phase 1 | Complete |
| ONBD-05 | Phase 1 | Complete |
| LEAD-01 | Phase 2 | Gaps Found |
| LEAD-02 | Phase 2 | Gaps Found |
| LEAD-03 | Phase 2 | Gaps Found |
| LEAD-04 | Phase 2 | Gaps Found |
| LEAD-05 | Phase 2 | Gaps Found |
| LEAD-06 | Phase 2 | Gaps Found |
| LEAD-07 | Phase 5 | Pending |
| MEAS-01 | Phase 4 | Gaps Found |
| MEAS-02 | Phase 3 | Complete |
| MEAS-03 | Phase 3 | Complete |
| MEAS-04 | Phase 3 | Complete |
| MEAS-05 | Phase 4 | Complete |
| MEAS-06 | Phase 3 | Complete |
| MEAS-07 | Phase 3 | Complete |
| MEAS-08 | Phase 4 | Gaps Found |

*Amended 2026-09-06 (plan 04.2-05, the repository and domain split): MEAS-08's intent is
unchanged — reports still describe browser-observable events as views, attempts and outbound clicks
rather than confirmed delivery, customers or completed onboarding. What is qualified is an adjacent
claim. An all-time figure is no longer "every event this project ever recorded"; the measurement
project now spans two properties, so it is every event recorded **on this domain**, bounded at the
2026-09-06 cutover, and it does not include earlier events recorded in the same project from the
previous address. "Truthfully" is thereby anchored to what the numbers now prove rather than to what
they proved before the move.*

| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |
| QUAL-03 | Phase 5 | Pending |
| QUAL-04 | Phase 04.2 | Complete |
| QUAL-05 | Phase 5 | Pending |
| QUAL-06 | Phase 1 | Complete |
| SPLT-01 | Phase 04.2 | Complete |
| SPLT-02 | Phase 04.2 | Complete |
| SPLT-03 | Phase 04.2 | Complete |
| SPLT-04 | Phase 04.2 | Complete |

### Phase 04.2 status evidence — set 2026-09-06 by plan `04.2-09` task 3

**Every row was set from a measured result, never from a plan's intention.** Each names the plan
summary that took the evidence and the command or fetched response behind it. A requirement whose
only support was a plan's stated aim would read `Owed`, not `Complete`; none does.

| ID | Status | Evidence taken by | Command or fetched response |
|---|---|---|---|
| **SPLT-01** | Complete | `04.2-08` (+ owner ratification of the 26-entry allowlist) | `npm run verify:disjoint` exit **0 in BOTH repositories** with byte-identical output, re-run 2026-09-06T14:23:47Z after the planning sync: 102 paths compared, 26 shared, 26 allowlisted, **0 violations**, 3 ratified collisions none converged, 0 ZPH product sources shipping HAOO source, 0 HAOO files naming a home-page symbol. Suites: `-t 'narrowed static boundary'` green in both. |
| **SPLT-02** | Complete | `04.2-02`, `04.2-03`, `04.2-07`, re-measured here | Fetched `https://www.haoo.online/` (200, 4,147 B): `canonical`, `og:url` → `https://www.haoo.online/`; `og:image`, `twitter:image` → `https://www.haoo.online/brochure/brochure-preview.png`; `rel="alternate" type="application/pdf"` → `/brochure/HAOO-Marketing-Brochure.pdf`. All four brochure assets **200** (PDF 2,160,873 B; preview 637,261 B; hero 2,098,046 B; logo 3,975 B). The one `noscript` link that is a HAOO URL — the brochure — is relative and resolves; the others are `tel:`/`mailto:`/`wa.me`/`manage.haoo.online` contact channels by design. Retired path `https://www.zero-paperhub.com/products/haoo/` → **200**, 4,353 B, carrying `<meta http-equiv="refresh" content="0; url=https://www.haoo.online/">`, `rel="canonical"` to the same, a visible `<a>` to it and a second to the brochure, and **zero `<script>` tags**. Suites: `-t 'first-party HAOO root canonical and social metadata'`, `-t 'recovery document'`, `-t 'uploads exactly the built dist tree'` all green. |
| **SPLT-03** | Complete | `04.2-06` (source half), `04.2-07` (artifact half), `04.2-09` T1 (configuration half) | `gh variable list --repo KaruguDev/HAOO` → exactly the three PostHog names, as **variables**; `--repo KaruguDev/ZERO-PAPERHUB` → **empty**. Values compared byte-identical with `cmp` **before** the originals were deleted. `gh secret list` → **empty on both**, so no report credential exists as a secret anywhere. Deployed HAOO project chunk `/assets/haoo-DGFKBCjE.js` (207,627 B, proved non-empty) **contains** the approved ingestion origin; deployed ZPH `/assets/main-ClJKpN3o.js` (179,611 B, proved non-empty) contains **0** ingestion origins, **0** `phc_` keys, **0** case-insensitive `posthog`, and the ZPH document references **no** `posthog-sdk` chunk. Suites: `-t 'carries no measurement'` (ZPH) and `-t 'report credential out of the deploy workflow'` (HAOO) green. |
| **SPLT-04** | Complete | `04.2-04` (owner's `blocking-human` copy gate), re-measured here against the DEPLOYED artifact | Present, once each, in the deployed HAOO project chunk: the controller heading *"Who operates HAOO and receives this information"*; *"Moving HAOO to its own web address does not change who operates it or who receives what you send"*; the processor sentence *"Aggregate page signals are processed by PostHog in the United States"*; and the relationship line *"A ZERO-PAPER HUB product"*. Suite: `-t 'disclosure'` → **20 cases green**. **This does NOT close the Kenya DPA 2019 sign-off — see the carry-forward table below.** |
| **PROD-02** | Complete | `04.2-03` (card and source line), `04.2-07` (recovery document), re-measured here | `https://www.haoo.online/` → 200. The ZERO-PAPER HUB Products card target read from the **deployed** bundle rather than the client-rendered root (D23): `/assets/main-ClJKpN3o.js` carries `https://www.haoo.online/` and `https://www.haoo.online/brochure/brochure-preview.png` and no other `haoo.online` URL. Retired path → 200 with the meta refresh, the canonical and a scriptless visible link. Suite: `products-section.test.tsx` 10 cases green. |
| **PROD-05** | Complete | `04.2-02` T1 | Title, description, canonical, `og:type/title/description/url/image` and `twitter:card/title/description/image` all present on the HAOO site's **own** published document and all naming `www.haoo.online` (fetched above). Suite: `-t 'first-party HAOO root canonical and social metadata'` green. |
| **PROD-06** | Complete **at its successor strength only** | `04.2-02` T1 | Suite: `-t 'rejects product-name literals'` green (`product-shell-reuse.test.tsx`). **The withdrawn half is recorded as WITHDRAWN and is NOT recorded as met:** the original claim that the collection *demonstrates reuse across more than one product* cannot be proved in a one-product repository — iterating a one-element collection cannot distinguish a generic shell from a hardcoded one, so the case would have passed while proving nothing. It is withdrawn in place, in `src/test/product-shell-reuse.test.tsx:274-293`, naming **three** successors by exact title: `renders a synthetic product through every product-named shell surface`, `reproduces every shipped product-name string byte for byte`, `rejects product-name literals in product-generic executable source` — all three in that file and all three green. |
| **QUAL-04** | Complete | `04.2-02` T1/T3, `04.2-09` T1 (transport) | Direct navigation and refresh both **200** on `https://www.haoo.online/`; the brochure asset **200** at 2,160,873 B. Served as physical files: `-t 'phase1-red:build'` and `-t 'uploads exactly the built dist tree'` green. Transport read 2026-09-06T14:12:41Z: `https_certificate.state = approved`, `https_enforced = true`, `protected_domain_state = verified`; live at 14:13:03Z: `http://www.haoo.online/` → 301 `https://…`, `https://www.haoo.online/` → 200, `http://haoo.online/` → 301, `https://haoo.online/` → 301, certificate subject `CN = www.haoo.online` with both legs in its SAN list. The four retired-path asset URLs return **404** as the requirement's own text states they will. |

**All eight gates in `04.2-VALIDATION.md`'s per-task map were re-run and every one is green**, in
the repository the row names, plus `SC1` (`npm run typecheck && npm run lint && npm test` in each).

**One map gap, recorded rather than papered over:** `04.2-VALIDATION.md` has **no row for PROD-02**.
Its status above rests on direct measurement (the three fetches and the deployed card target) and on
`products-section.test.tsx`, not on a declared gate — because none was declared. That is a defect in
the validation map, not in the requirement.

### Carried forward from Phase 04.2 — genuinely owed, with an owner and a phase

Recorded here rather than absorbed. Nothing below is closed by anything this phase did.

| Item | Status | Owner | Phase |
|---|---|---|---|
| **Kenya Data Protection Act 2019 sign-off** (`02-VALIDATION.md:91`) | **OPEN — and explicitly NOT closed by the owner's copy approval.** The owner said so in terms at plan `04.2-04`'s gate: *"This approval covers visitor-facing wording ONLY. It does not close `02-VALIDATION.md:91`. Approving copy is not a data-protection review, and that item covers notice, storage, retention and processor decisions that need someone with legal standing to sign."* SPLT-04 above is Complete on the truth of the statements; that is a different claim from a data-protection review, and neither implies the other. | someone with legal standing, engaged by the repository owner | not yet scheduled — must not be inherited as closed by Phase 5 |
| **Mail routing for `haoo.online`** — no MX records; RFC 5321 implicit-MX falls back to the A record, which is GitHub Pages, which runs no SMTP, so mail to `info@haoo.online` very likely does not arrive. Owner decision recorded 2026-09-05: point MX at `mx1.privateemail.com` / `mx2.privateemail.com`. **The DNS change was deliberately scoped out of this phase.** `info@haoo.online` is the qualification-form fallback target, the `mailto:` onboarding link and a `noscript` recovery link. | DECIDED, NOT EXECUTED | repository owner | Phase 5 / LEAD-07 |
| **The certificate serving the HAOO host was issued 2026-09-03, two days before the reclaim, while a third party held the Pages claim** (`04.2-DEFERRED-ITEMS.md` D34). Not a key compromise — Pages holds the key and never released it — but it is the certificate a CT-log monitor reads until 2026-12-02. | OPEN, measured | repository owner | Phase 5 or milestone audit |
| **Removal of the ZERO-PAPER HUB planning directory** (D-03 second half, `04.2-DEFERRED-ITEMS.md` D37) | **SCHEDULED** with command, owner and trigger; destination proven a byte-for-byte superset over 239 files first | repository owner, via `/gsd-quick` | on `/gsd-verify-work 04.2` sign-off |
| **The stranded browser record at the retired origin** (D25) | **ACCEPTED AND RECORDED** by owner decision — a deliberate non-action, not an omission. No code artifact exists, which is why it is written down. | closed by decision | none |
| **Phase 04.1's live provider gates** — UAT checkpoint 10 (one action, one event, no person profile, ingestion accepts the reduced payload) and then checkpoint 8 (report reconciliation). The deployment half of `G-04.1-3` is re-taken and closed against `www.haoo.online`; the provider's half is untouched by this phase. **Zero events arriving at checkpoint 10 is a FAILURE, never a quiet pass.** | OPEN | privacy/product owner | Phase 04.1 UAT, before Phase 5 relies on any count |

**Coverage:**

- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

*Status tally, recounted from the table above 2026-09-06 after plan `04.2-09` task 3 set the eight
Phase 04.2 statuses: **23 Complete, 8 Gaps Found, 5 Pending**, 36 rows. All eight Phase 04.2 rows —
`SPLT-01`–`SPLT-04`, `PROD-02`, `PROD-05`, `PROD-06`, `QUAL-04` — read `Complete`, each on the
measured evidence recorded above rather than on a plan's intention. The five `Pending` are Phase 5's
(`LEAD-07`, `QUAL-01`, `QUAL-02`, `QUAL-03`, `QUAL-05`); the eight `Gaps Found` are unchanged by this
phase and include `MEAS-01` and `MEAS-08`, whose live provider gates this phase deliberately did not
tick.*

*Phase 04.2 re-points eight requirement IDs. `SPLT-01` through `SPLT-04` are new v1 requirements
introduced by the repository-and-domain split. `PROD-02`, `PROD-05`, `PROD-06` and `QUAL-04` moved
from `Phase 1 | Complete` to `Phase 04.2 | Pending`: Phase 1 genuinely met them, but this phase makes
their original statements false, so they are owed re-verification against the amended text rather
than inherited as complete. `PROD-06`'s reuse half is withdrawn with a named successor, never
deleted — see the requirement. **All four have now been re-verified
against their amended text and read `Phase 04.2 | Complete` as of 2026-09-06 — re-verified, never
inherited.** `PROD-06` is Complete at its SUCCESSOR strength only; its reuse half stays withdrawn
and is not recorded as met.*

---
*Requirements defined: 2026-08-29*
*Last updated: 2026-09-05 — Phase 04.2 plan 01 amended PROD-02, PROD-05, PROD-06, QUAL-04 and mapped SPLT-01..04*
*Amended: 2026-09-06 — plan 04.2-08 restated SPLT-01 as content ownership rather than string occurrence, per the
owner decision recorded in 04.2-SPLIT-CONTRACT.md § Shared scaffold. The predecessor wording was unsatisfiable as
literally written (both repositories legitimately carry the same toolchain) and self-defeating on its positive half
(it forbade the guards from naming what they guard against). Marked Complete on a green `npm run verify:disjoint`
in both repositories, not on prose.*
*Amended: 2026-09-06 — plan 04.2-09 task 3 set all eight Phase 04.2 statuses to `Complete` from
measured evidence (see § Phase 04.2 status evidence), recorded `PROD-06`'s withdrawn half as
withdrawn with its three named successors, and carried forward five genuinely outstanding items with
an owner and a phase each — foremost the Kenya Data Protection Act 2019 sign-off, which the owner
stated in terms is NOT closed by their approval of the visitor-facing copy.*
