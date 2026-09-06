# API Coverage — GitHub platform, Namecheap DNS, and the two surfaces carried forward

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Detector result: `{"detected":true,"signals":[{"verb":"(surface)","noun":"api"},{"verb":"wire","noun":"sdk"}]}`.
> The `wire`/`sdk` signal is `04.2-05-PLAN.md:42`, a constraint on the PostHog Query API; the bare
> `api` signal is the `gh api` work in plans 04.2-01, 04.2-02 and 04.2-09.
>
> **What is new in this phase and what is not.** Phase 04.2 moves and re-points; it adds no product
> capability. The external surface it genuinely *newly* integrates is the **GitHub platform** —
> repositories, Pages, Actions configuration and the `gh` token itself — together with the
> **Namecheap DNS** zone that stands behind the new hostname. Those two are enumerated below from a
> full-coverage baseline.
>
> **PostHog and FormSubmit are carried forward from the 04.1 matrix, not re-decided.** Re-deciding
> them here would be an undeclared scope change: the phase boundary states it does not re-open a
> settled measurement or disclosure decision "except where a decision is made false by the change of
> origin". The `## Carried forward` section below therefore lists only the rows the change of origin
> made false, and points at
> `.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/COVERAGE.md` for the rest.
> That file is byte-identical in both repositories by design
> (`scripts/verify-tree-disjointness.mjs:26`) and is the one the 69-row audit
> (`scripts/verify-phase4-coverage.mjs`) is pinned to. **This document is not audited by that
> script** — the script takes the 04.1 path as its sole argument
> (`verify-phase4-coverage.mjs:303`) — so nothing here is gated by CI, and every row below is a
> reasoned decision rather than a checked one.

## GitHub — repositories

| capability | decision | reason |
|---|---|---|
| create a new repository (`KaruguDev/HAOO`) | INTEGRATE | D-01/D-02: HAOO is a newly created repository; ZERO-PAPERHUB keeps its own identity |
| clone-and-prune to seed it, keeping all 412 commits | INTEGRATE | D-01: `git blame` and `git log --follow` keep working on every HAOO file, so the rationale encoded across Phases 1–04.1 stays reachable from the code it constrains |
| push over SSH | INTEGRATE | the transport every 04.2 commit used; recorded as `success` on the deploy run for each |
| public visibility | INTEGRATE | forced, not preferred: Pages from a private repository requires a paid plan (04.2-01 *Issues Encountered* §2), and the account plan could not be read to rule that out |
| the `repo` and `workflow` token scopes | INTEGRATE | `.github/workflows/deploy.yml` is pushed by this phase, and GitHub rejects a workflow-file push without `workflow`; obtained by `gh auth refresh -h github.com -s workflow` (04.2-01 next-step 1) |
| `gh run list` / `gh run view` for deploy conclusions | INTEGRATE | every "green" claim in this phase's summaries names a run id and its conclusion rather than asserting one — e.g. run `34020433214`, run `34020310713` |
| fork | OPT-OUT | a fork carries an upstream linkage this repository must not have, and it cannot be pruned to a different tree shape without the linkage becoming misleading |
| repository transfer | OPT-OUT | ZERO-PAPERHUB keeps its identity, issues and history (D-02); transferring would move the wrong half |
| template repository | OPT-OUT | the whole point of D-01 is inheriting 412 commits of history; a template starts empty |
| history rewriting (`git filter-repo`, force-push) | OPT-OUT | D-02: it would force-push over every existing clone and break the commit SHAs `.planning/` cites directly. See note [a] |
| issue, project, wiki or release migration | OPT-OUT | D-02: those belong to ZERO-PAPERHUB and stay there. Nothing in the split needs them on the other side |
| `gh api user` plan readback | OPT-OUT | the token lacks the `user` scope, so it returns `plan: null` (04.2-01); granting a scope to read one field was declined. See note [b] |
| the account-level `user` and `admin:org` scopes generally | OPT-OUT | this is a personal account doing repository-scoped work; a broader token would grant reach the phase never uses |


**[a]** HAOO source leaves ZERO-PAPERHUB by an ordinary deleting commit, not by a rewrite. Past
commits keep the files; the working tree does not. SPLT-01 is a claim about what each repository
*builds and ships*, and that claim stays true under a normal deletion. A `filter-repo` pass would
have force-pushed over every existing clone and broken the SHA citations throughout `.planning/`.

**[b]** The risk the plan readback was meant to close — Pages refusing to publish from a private
repository on a free plan — is closed instead by making the repository public, which needs no token
scope at all. A broader token to read one field would have been permanent; the visibility choice is
visible in the repository itself.

**[c]** **No second recovery document is to be built for the apex leg.** A plan that adds one is
adding a file to do a job the platform already does. The same single `CNAME` line decides which leg
is canonical, and Pages supplies the counterpart redirect for whichever leg it is not.

## GitHub — Pages

| capability | decision | reason |
|---|---|---|
| `GET /repos/{owner}/{repo}/pages` | INTEGRATE | the single read that proves the site's binding; used with a timestamp rather than assumed — `gh api repos/KaruguDev/HAOO/pages @ 2026-09-06T14:12:41Z` (04.2-09 D4) |
| `PUT /repos/{owner}/{repo}/pages` with `-f cname=` | INTEGRATE | the only write this phase makes to the platform. Used once in 04.2-02 to correct a pre-existing binding, and again at the decision (a) reversal |
| the `CNAME` file, exactly one line | INTEGRATE | the single line is what decides which leg is canonical. `www.haoo.online` in the HAOO repository; `www.zero-paperhub.com` in ZERO-PAPERHUB, unchanged |
| `build_type: workflow` | INTEGRATE | the artifact `deploy-pages` uploads is the built `dist/`, so the tests that validate `dist/` validate what ships; measured already `workflow` in 04.2-02 |
| the automatic apex → `www` counterpart redirect | INTEGRATE | platform-supplied and domain-level: the apex already carries the Pages `A`/`AAAA` records, so it redirects with no configuration from us. See note [c] |
| `https_enforced` | INTEGRATE | read as `true` at the recorded timestamp (QUAL-04); enforcement is asserted from the platform's own state, not from a scheme in a link |
| the managed certificate naming both legs | INTEGRATE | `cert_state=approved`, `domains=["www.haoo.online","haoo.online"]`, `expires_at=2026-12-02` — one certificate is what makes the apex leg reachable over HTTPS |
| account-level verified domain (`protected_domain_state: verified`) | INTEGRATE | backed by the two `_github-pages-challenge-karugudev` TXT records at Namecheap; it is what stops another account claiming the hostname after a future DNS change |
| Pages from a private repository | OPT-OUT | requires a paid plan (04.2-01). The repository is public instead — the cost is that the pruned history is world-readable |
| branch-based publishing (`gh-pages`, `/docs`) | OPT-OUT | superseded by `build_type: workflow`; a branch source would publish a tree no test in this repository has seen |
| the Jekyll build | OPT-OUT | this is a Vite build; a Jekyll pass would process files the build already emitted |
| **path-level redirects** | OPT-OUT | **not available, not declined** — Pages emits exactly one real 3xx and it is domain-level. This is why the retired path is served by a document. See note [d] |
| host-level rewrite configuration (`.htaccess`, `CNAME.txt` in `public/`) | OPT-OUT | GitHub Pages reads neither. Both files were removed by 04.2-07 precisely because their presence told a reader a rewrite mechanism existed when none did |
| JavaScript in the recovery document | OPT-OUT | the script budget for that document is exactly zero (04.2-04 D25, orphaned-record disposition): a recovery page that needs script to recover is one more thing that can fail on the way |
| a custom `404.html` | OPT-OUT | not needed and not built. The one path that would have 404'd is served by the recovery document above; inventing a general 404 page is product work this phase does not own |


**[d]** 04.2-07 ships a scriptless document at `https://www.zero-paperhub.com/products/haoo/` — a
`meta refresh`, a `canonical`, and a plain anchor — and the path returns `200` where it previously
returned `404`. A redirect was not declined in favour of a document; the platform offers no
path-level redirect to decline.

## GitHub — Actions and repository configuration

| capability | decision | reason |
|---|---|---|
| `permissions: contents: read, pages: write, id-token: write` | INTEGRATE | the minimum `deploy-pages@v4` needs; `id-token` is consumed by the Pages deployment's OIDC exchange and by nothing else |
| `environment: github-pages` with the `page_url` output | INTEGRATE | the deployment's URL comes from the platform rather than from a literal a human retyped |
| `concurrency: group: pages`, `cancel-in-progress: false` | INTEGRATE | cancelling a live Pages publish mid-flight can leave the site partially updated; a queued run waits instead |
| pinned first-party actions, major version only | INTEGRATE | `checkout@v6`, `setup-node@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4` — no third-party action runs in either workflow |
| `setup-node` `cache: npm` | INTEGRATE | the only caching in either workflow, and it caches a lockfile-derived tree rather than a build output |
| `workflow_dispatch` | INTEGRATE | lets the owner re-deploy without an empty commit — needed because a repository-variable change alone does not trigger a push build |
| repository **variables** (`vars.VITE_HAOO_*`) | INTEGRATE | the three PostHog values live on `KaruguDev/HAOO` and on no other repository (04.2-09 D1). See note [e] |
| repository **secrets** | OPT-OUT | `gh secret list` is empty on both repositories, deliberately: Vite inlines every `VITE_*` value into the published bundle. See note [f] |
| environment-scoped variables or secrets | OPT-OUT | one environment, one deploy; scoping would add a second place a value can be set and disagree |
| organization-level variables or secrets | OPT-OUT | a personal account — there is no organization to scope to |
| any measurement build variable in the ZPH workflow | OPT-OUT | SPLT-03: the four `VITE_HAOO_*` assignments and their justifying paragraphs went in the same commit as their readers. See note [g] |
| the "Verify capability coverage" step in the ZERO-PAPERHUB workflow | OPT-OUT | its argument was a path inside `.planning/`, which moves to HAOO under D-03; leaving it would fail the deploy on a missing path. The step survives in the HAOO workflow, where its subject does |
| self-hosted runners | OPT-OUT | `ubuntu-latest` builds a static site; a self-hosted runner would add a machine to trust for no gain |
| OIDC beyond the Pages deployment | OPT-OUT | there is no cloud role to assume — the deployment target is Pages itself |
| Dependabot / automated dependency PRs | OPT-OUT | not decided in this phase. Two repositories now need this answered rather than one, which is a reason to decide it deliberately later, not a reason to switch it on here |


**[e]** The three values were copied through stdin from captured JSON and compared with `cmp`
**before** the originals were deleted, so a wrong key was impossible rather than unlikely. Absence
on the other side is asserted too: `gh variable list --repo KaruguDev/ZERO-PAPERHUB | grep -c
VITE_HAOO_` is `0`.

**[f]** Storing the PostHog values as secrets would claim a confidentiality the published JavaScript
immediately contradicts — they are world-readable the moment the site is served. The report
credentials `POSTHOG_QUERY_API_KEY` and `POSTHOG_PROJECT_ID` are local report-process inputs and
exist as neither variable nor secret on either repository.

**[g]** `src/test/build-output.test.ts` asserts that **empty set explicitly** rather than iterating
nothing, with a mutation probe beside it — an empty roster and a parser that has stopped matching
the file look identical otherwise, and only the probe tells them apart.

## Namecheap — the `haoo.online` DNS zone

| capability | decision | reason |
|---|---|---|
| four `A` and four `AAAA` records at the apex, pointing at the Pages edge | INTEGRATE | already in place; they are what makes the apex resolve *and* what makes the automatic apex → `www` redirect possible |
| `www` as a `CNAME` to `karugudev.github.io` | INTEGRATE | the canonical leg after the decision (a) reversal |
| two `_github-pages-challenge-karugudev` TXT records | INTEGRATE | the account-level domain verification behind `protected_domain_state: verified` |
| `MX` records for `haoo.online` | OPT-OUT | decided but out of scope: the owner chose `mx1`/`mx2.privateemail.com` on 2026-09-05; the DNS change belongs to Phase 5 / LEAD-07. See note [h] |
| any DNS change as part of the decision (a) reversal | OPT-OUT | both legs already resolved correctly before the reversal and still do. Only the repository `CNAME` file and the Pages custom-domain setting moved |
| `ALIAS` / `ANAME` apex flattening | OPT-OUT | the apex uses the documented `A`/`AAAA` record set; flattening would substitute a provider-specific mechanism for the one GitHub documents |
| `CAA` records | OPT-OUT | not decided in this phase. The managed certificate issued without one; adding a CAA policy is a deliberate change to who may issue for the zone and deserves its own decision |
| `manage.haoo.online` | OPT-OUT | a separate host owning self-onboarding. Which leg the marketing site canonicalises on has no bearing on it, and it never becomes `www.manage.haoo.online` |


**[h]** Consequence, stated rather than left to be inferred: with no MX, RFC 5321 implicit-MX
fallback delivers to the `A` record, which is GitHub Pages, which runs no SMTP — so mail to
`info@haoo.online` very likely does not arrive. That is inferred from DNS, not confirmed by a test
send (RESEARCH assumption A7). No plan in this phase performs the change or asserts against it.
`info@haoo.online` is the qualification-form fallback target, the `mailto:` onboarding link, and the
target of the `noscript` recovery links.

## Carried forward — PostHog and FormSubmit

The full matrices are in
`.planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/COVERAGE.md` (browser SDK,
Query API, FormSubmit). **No row there is re-decided here.** Four things the change of origin made
false or newly true, and nothing else:

| what changed | where | why it is not a re-decision |
|---|---|---|
| the three PostHog build variables now live on `KaruguDev/HAOO` and on no other repository | 04.2-09 D1 | the capability set is unchanged; only which repository supplies it moved. Confirmed absent-then-present on the same artifact: the project chunk carried `0` hits for the ingestion origin on 2026-09-05 and carries `https://us.i.posthog.com` after the variables existed (04.2-09 D2) |
| ZERO-PAPERHUB ships **no** measurement surface at all | 04.2-06 D2, 04.2-09 D3 | SPLT-03. Not an opt-out from the 04.1 matrix — a removal of the whole matrix from one of the two repositories. Measured on the live bundle: `/assets/main-ClJKpN3o.js`, 179,611 bytes, `0` ingestion origins, `0` `phc_` keys, `0` case-insensitive `posthog`, and `/assets/posthog-sdk-*.js` returning `404` |
| every owner-report query is bounded at the HAOO domain cutover day, 2026-09-06 | 04.2-05 | the Query API capability rows are unchanged; what changed is the **range** each request carries. D-11 keeps both properties in one measurement project, so an unbounded query sums across two properties while its heading names one. `cutoverDay` is a required member of `ReportModel` so omission is a typecheck error, not a plausible-looking document whose numbers disagree with its headings |
| the FormSubmit disclosure names FormSubmit as first recipient and stops short of claiming arrival | 04.2-04 | the FormSubmit field set is unchanged. The copy changed because the origin changed: the shipped sentence is "…sent through FormSubmit, a third-party email-forwarding service, which passes them to ZERO-PAPER HUB." **No sentence in this phase claims mail arrives anywhere**, because `haoo.online` has no MX records and that change is out of scope |

## Operational boundary

**What this phase establishes.** Two repositories that build and deploy independently, with no
build-time dependency between them (SPLT-01), proven disjoint by
`scripts/verify-tree-disjointness.mjs` against a 26-entry shared-scaffold allowlist that is
byte-identical on both sides. A HAOO site live at `https://www.haoo.online/` over enforced HTTPS on
a certificate naming both legs. A capturing HAOO deploy, confirmed against the final hostname. A
ZERO-PAPERHUB artifact carrying no measurement code, ingestion origin or credential shape. A
recovery document at the retired path, returning `200` where it returned `404`.

**What it does not establish, stated rather than left to be inferred from a green run.**

1. **Mail to `info@haoo.online` arriving.** The MX decision is recorded; the DNS change is Phase 5 /
   LEAD-07. A qualification-form submission that reports success in the browser has **not** been
   proven to reach the inbox, and the HAOO README says so plainly.
2. **The Kenya DPA 2019 sign-off.** SPLT-04 is Complete on the truth of the visitor-facing
   statements. The data-protection sign-off is a different claim and is carried forward OPEN,
   exactly as the owner stated at 04.2-04's gate.
3. **Live PostHog ingestion outcomes.** Acceptance of the three-property payload and the absence of
   a person profile remain owner observations, inherited unchanged from 04.1 D-05. This phase moved
   where the events are sent from; it did not observe what happened when they arrived.
4. **The analytics-property human check.** Still open, and the cutover deliberately did not wait on
   it (`04.2-SPLIT-CONTRACT.md` § *Analytics-property human check*).
5. **The ZERO-PAPERHUB `.planning/` removal.** D-03 moves the directory whole to HAOO; the removal
   from this repository is a scheduled follow-up with a named owner, trigger and exact command
   (04.2-09), not something this phase performed.

**One-way choices.** The pruned HAOO history is one-way once pushed and worked on (D-01): re-deriving
a different history shape means rewriting every SHA, and 04.1 documents cite commit SHAs directly.
The public repository visibility is a consequence of the Pages-on-private plan gate, not a
preference. Both are recorded here so a later reader does not mistake either for a default.

**The decision (a) reversal is kept visible, not folded away.** The canonical leg was the apex from
2026-09-05 until 2026-09-06, and `04.2-02-SUMMARY.md` is the account of what shipped on 2026-09-05 —
deliberately not rewritten. Its statements were true when written and are superseded. Every row in
this document that names a hostname resolves against `https://www.haoo.online/`; `info@haoo.online`
is a mailbox and `manage.haoo.online` is a separate host, and neither takes the `www` prefix.
