---
schema_version: 1
open_count: 22
waived_count: 0
fixed_count: 5
total_count: 27
last_updated: 2026-09-06T08:44:48.476Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/products/haoo.ts | 10 | Wave 0 HAOO_PRODUCT intentionally contains typed placeholder facts and empty story collections until Plans 01-02 and 01-03. | open |  | 2026-08-29T09:32:59.474Z |  |
| 2 | 01 | stub | src/components/ProductsSection.tsx | 10 | Wave 0 ProductsSection intentionally renders only a placeholder landmark until Plan 01-04. | open |  | 2026-08-29T09:32:59.636Z |  |
| 3 | 01 | stub | src/pages/ProductPage.tsx | 10 | Wave 0 ProductPage intentionally renders only compile-safe placeholder landmarks until Plans 01-02, 01-03, and 01-05. | fixed |  | 2026-08-29T09:32:59.797Z | 2026-08-29T10:44:29.662Z |
| 4 | 01 | deviation | vitest.config.ts | 1 | Added the existing React Vite plugin to Vitest and rejected React-is-not-defined output so infrastructure failures cannot satisfy expected RED. | open |  | 2026-08-29T09:32:59.971Z |  |
| 5 | 01 | deviation | src/pages/ProductPage.tsx | 65 | Removed an unsupported security characterization from the self-onboarding copy to preserve brochure source fidelity. | open |  | 2026-08-29T09:42:36.668Z |  |
| 6 | 01 | stub | src/products/haoo.ts |  | HAOO_PRODUCT.brochure pdfHref/downloadName/expectationLabel remain placeholders pending plan 01-05 | fixed |  | 2026-08-29T10:22:12.183Z | 2026-08-29T10:44:29.827Z |
| 7 | 02 | stub | src/products/haoo.ts |  | phone.formatPattern and phone.formatMessage ship as configuration but no validator reads them until plan 02-04 wires the permissive phone format | open |  | 2026-08-30T08:19:23.966Z |  |
| 8 | 02 | stub | src/products/haoo.ts |  | organization.requiredMessage and message.requiredMessage are unreachable copy demanded by the non-optional QualifyField.requiredMessage shape; both fields are permanently optional | open |  | 2026-08-30T08:19:24.116Z |  |
| 9 | 02 | lint-warning | src/components/QualifyForm.tsx | 28 | react-refresh/only-export-components: QualifyForm.tsx exports helpers beside the component (4 warnings, pre-existing from 02-01, lint exits 0) | open |  | 2026-08-30T08:27:54.452Z |  |
| 10 | 04 | unrun-verify | .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-01-PLAN.md |  | 04-01 Task 2 <human-check> not run: needs a real PLAUSIBLE_STATS_API_KEY and PLAUSIBLE_SITE_ID (available only after the 04-05 provider-approval checkpoint) plus a human judging counts against the dashboard; carried as 04-01-SUMMARY coverage D6 | open |  | 2026-09-01T03:46:55.653Z |  |
| 11 | 04 | unrun-verify | src/products/haoo.ts |  | 04-02 Task 3 <human-check>: a person must read the maximum-length engagement summary as it would appear in the email body and confirm it reads as one coherent paragraph with no score-like or person-like claim. Carried to phase-end UAT as coverage D6. | open |  | 2026-09-01T04:13:09.236Z |  |
| 12 | 04 | unrun-verify | src/components/MeasurementDisclosure.tsx |  | Task 3 human-check not run: 320px viewport and 200% zoom reading of the new disclosure group and the replaced notice clause; carried to phase-end UAT as 04-04-SUMMARY coverage D6 | open |  | 2026-09-01T06:45:08.472Z |  |
| 13 | 04 | unrun-verify | src/reporting/render.ts |  | Surface A backstop visual checks at 320px and 200% zoom, and the screen-reader announcement check, could not be run: jsdom computes no layout. Carried to UAT as 04-03 coverage D9 and D10. | open |  | 2026-09-01T07:04:25.198Z |  |
| 14 | 04 | deviation | scripts/generate-haoo-report.mjs |  | Captured CLI failure diagnostics required synchronous stderr writes before nonzero shutdown | fixed |  | 2026-09-01T19:23:08.473Z | 2026-09-01T19:23:38.574Z |
| 15 | 04 | unrun-verify | .planning/REQUIREMENTS.md |  | MEAS-01 human gate open: production privacy approval, ten dashboard goals, and live event-uniqueness confirmation are unrun | open |  | 2026-09-02T05:45:11.601Z |  |
| 16 | 04 | unrun-verify | .planning/REQUIREMENTS.md |  | MEAS-08 human gate open: live report reconciliation against the raw provider dashboard is unrun | open |  | 2026-09-02T05:45:11.752Z |  |
| 17 | 04 | unrun-verify | .planning/REQUIREMENTS.md |  | MVP outcome and privacy readability judgment at 320px and 200% zoom with keyboard and screen-reader use is unrun; carries the five backstop UI considerations E1, E2, E3, E4, E7 | open |  | 2026-09-02T05:45:11.913Z |  |
| 18 | 04 | deviation | .planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md |  | 04-13 Task 3: plan's automated literal 'Status: Incomplete' never matched the shipped '**Status:** Incomplete' header; intent satisfied by a truthful restatement instead of editing the prohibited header line | open |  | 2026-09-02T11:11:42.813Z |  |
| 19 | 04.1 | deviation | scripts/generate-haoo-report.mjs | 97 | CLI removed-variable table must keep the four previous-provider names; collides with 04.1-08 whole-tree name gate | fixed |  | 2026-09-03T18:38:40.212Z | 2026-09-03T19:55:34.314Z |
| 20 | 04.1 | deviation | .planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/deferred-items.md |  | 04.1-08 narrowed the whole-tree provider-name gate to three justified line shapes; the narrowed grep is prose, not a committed test | open |  | 2026-09-03T19:55:58.994Z |  |
| 21 | 04.1 | deviation | .planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-10-PLAN.md |  | 04.1-10 Task 2: the plan's stated post-task ambient-slot-literal count for measurement.test.ts (13) was not met; the true count is 9. Reported as a finding with a per-literal reconciliation in 04.1-10-SUMMARY rather than adjusted. Five literals whose subjects reached LATER gates were migrated to the injected-client seam to preserve initialization/lockdown/absentCapture coverage; their ambient halves moved into hostileSlotRows. | open |  | 2026-09-04T22:02:48.727Z |  |
| 22 | 04.1 | deviation | .planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-10-PLAN.md |  | 04.1-10 Task 2: the plan's call-site criterion is self-contradictory (all 16 sites use the non-occupying shape AND grep installPostHogVendorClient( still reports 15/1). Intent met: 0/0 for the occupying installer, 19/1 for createPostHogVendorClient, no call site deleted. | open |  | 2026-09-04T22:02:48.872Z |  |
| 23 | 04.1 | unmet-truth | .github/workflows/deploy.yml |  | Deploy workflow reads VITE_HAOO_MEASUREMENT_PROVIDER/TOKEN/API_HOST, but the three GitHub Actions repository variables are NOT confirmed created — an absent variable fails the selector closed to none and the deploy captures nothing while every gate passes | open |  | 2026-09-04T22:24:21.297Z |  |
| 24 | 04.2 | deviation | .planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-SPLIT-CONTRACT.md |  | Q3: recorded root-level asset directory 'assets/' collides with Vite's default build.assetsDir; build-output.test.ts scans every file under dist/assets as a build output. Owner must amend or confirm before plan 04.2-02 moves any file. | fixed |  | 2026-09-05T20:53:06.945Z | 2026-09-05T20:59:37.216Z |
| 25 | 04.2 | deviation | src/test/measurement-page.test.tsx | 258 | Twelve bare /products/haoo/ jsdom paths remain in the HAOO suite; :258's pathname assertion cannot move to the root without becoming jsdom's default (04.2-DEFERRED-ITEMS D7) | open |  | 2026-09-05T22:04:08.271Z |  |
| 26 | 04.2 | deviation | AGENTS.md | 60 | HAOO repository's AGENTS.md still describes ZERO-PAPER HUB files that no longer exist in its tree (04.2-DEFERRED-ITEMS D8) | open |  | 2026-09-05T22:04:08.418Z |  |
| 27 | 04.2 | deviation | README.md |  | 04.2-06 left README claiming the retired /products/haoo/ path returns 404; false once 04.2-07 shipped the recovery document. Corrected and gated (D29). | open |  | 2026-09-06T08:44:48.476Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "src/products/haoo.ts",
    "line": 10,
    "description": "Wave 0 HAOO_PRODUCT intentionally contains typed placeholder facts and empty story collections until Plans 01-02 and 01-03.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T09:32:59.474Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "stub",
    "phase": "01",
    "file": "src/components/ProductsSection.tsx",
    "line": 10,
    "description": "Wave 0 ProductsSection intentionally renders only a placeholder landmark until Plan 01-04.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T09:32:59.636Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "stub",
    "phase": "01",
    "file": "src/pages/ProductPage.tsx",
    "line": 10,
    "description": "Wave 0 ProductPage intentionally renders only compile-safe placeholder landmarks until Plans 01-02, 01-03, and 01-05.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-29T09:32:59.797Z",
    "resolved_at": "2026-08-29T10:44:29.662Z"
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "01",
    "file": "vitest.config.ts",
    "line": 1,
    "description": "Added the existing React Vite plugin to Vitest and rejected React-is-not-defined output so infrastructure failures cannot satisfy expected RED.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T09:32:59.971Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "01",
    "file": "src/pages/ProductPage.tsx",
    "line": 65,
    "description": "Removed an unsupported security characterization from the self-onboarding copy to preserve brochure source fidelity.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T09:42:36.668Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "stub",
    "phase": "01",
    "file": "src/products/haoo.ts",
    "line": null,
    "description": "HAOO_PRODUCT.brochure pdfHref/downloadName/expectationLabel remain placeholders pending plan 01-05",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-29T10:22:12.183Z",
    "resolved_at": "2026-08-29T10:44:29.827Z"
  },
  {
    "id": 7,
    "kind": "stub",
    "phase": "02",
    "file": "src/products/haoo.ts",
    "line": null,
    "description": "phone.formatPattern and phone.formatMessage ship as configuration but no validator reads them until plan 02-04 wires the permissive phone format",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-30T08:19:23.966Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "stub",
    "phase": "02",
    "file": "src/products/haoo.ts",
    "line": null,
    "description": "organization.requiredMessage and message.requiredMessage are unreachable copy demanded by the non-optional QualifyField.requiredMessage shape; both fields are permanently optional",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-30T08:19:24.116Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "lint-warning",
    "phase": "02",
    "file": "src/components/QualifyForm.tsx",
    "line": 28,
    "description": "react-refresh/only-export-components: QualifyForm.tsx exports helpers beside the component (4 warnings, pre-existing from 02-01, lint exits 0)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-30T08:27:54.452Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "unrun-verify",
    "phase": "04",
    "file": ".planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-01-PLAN.md",
    "line": null,
    "description": "04-01 Task 2 <human-check> not run: needs a real PLAUSIBLE_STATS_API_KEY and PLAUSIBLE_SITE_ID (available only after the 04-05 provider-approval checkpoint) plus a human judging counts against the dashboard; carried as 04-01-SUMMARY coverage D6",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-01T03:46:55.653Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "src/products/haoo.ts",
    "line": null,
    "description": "04-02 Task 3 <human-check>: a person must read the maximum-length engagement summary as it would appear in the email body and confirm it reads as one coherent paragraph with no score-like or person-like claim. Carried to phase-end UAT as coverage D6.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-01T04:13:09.236Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "src/components/MeasurementDisclosure.tsx",
    "line": null,
    "description": "Task 3 human-check not run: 320px viewport and 200% zoom reading of the new disclosure group and the replaced notice clause; carried to phase-end UAT as 04-04-SUMMARY coverage D6",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-01T06:45:08.472Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "src/reporting/render.ts",
    "line": null,
    "description": "Surface A backstop visual checks at 320px and 200% zoom, and the screen-reader announcement check, could not be run: jsdom computes no layout. Carried to UAT as 04-03 coverage D9 and D10.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-01T07:04:25.198Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "deviation",
    "phase": "04",
    "file": "scripts/generate-haoo-report.mjs",
    "line": null,
    "description": "Captured CLI failure diagnostics required synchronous stderr writes before nonzero shutdown",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-01T19:23:08.473Z",
    "resolved_at": "2026-09-01T19:23:38.574Z"
  },
  {
    "id": 15,
    "kind": "unrun-verify",
    "phase": "04",
    "file": ".planning/REQUIREMENTS.md",
    "line": null,
    "description": "MEAS-01 human gate open: production privacy approval, ten dashboard goals, and live event-uniqueness confirmation are unrun",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T05:45:11.601Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "unrun-verify",
    "phase": "04",
    "file": ".planning/REQUIREMENTS.md",
    "line": null,
    "description": "MEAS-08 human gate open: live report reconciliation against the raw provider dashboard is unrun",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T05:45:11.752Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "unrun-verify",
    "phase": "04",
    "file": ".planning/REQUIREMENTS.md",
    "line": null,
    "description": "MVP outcome and privacy readability judgment at 320px and 200% zoom with keyboard and screen-reader use is unrun; carries the five backstop UI considerations E1, E2, E3, E4, E7",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T05:45:11.913Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "deviation",
    "phase": "04",
    "file": ".planning/phases/04-report-and-enrich-the-haoo-funnel-truthfully/04-USER-SETUP.md",
    "line": null,
    "description": "04-13 Task 3: plan's automated literal 'Status: Incomplete' never matched the shipped '**Status:** Incomplete' header; intent satisfied by a truthful restatement instead of editing the prohibited header line",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-02T11:11:42.813Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "deviation",
    "phase": "04.1",
    "file": "scripts/generate-haoo-report.mjs",
    "line": 97,
    "description": "CLI removed-variable table must keep the four previous-provider names; collides with 04.1-08 whole-tree name gate",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-03T18:38:40.212Z",
    "resolved_at": "2026-09-03T19:55:34.314Z"
  },
  {
    "id": 20,
    "kind": "deviation",
    "phase": "04.1",
    "file": ".planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/deferred-items.md",
    "line": null,
    "description": "04.1-08 narrowed the whole-tree provider-name gate to three justified line shapes; the narrowed grep is prose, not a committed test",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T19:55:58.994Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "deviation",
    "phase": "04.1",
    "file": ".planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-10-PLAN.md",
    "line": null,
    "description": "04.1-10 Task 2: the plan's stated post-task ambient-slot-literal count for measurement.test.ts (13) was not met; the true count is 9. Reported as a finding with a per-literal reconciliation in 04.1-10-SUMMARY rather than adjusted. Five literals whose subjects reached LATER gates were migrated to the injected-client seam to preserve initialization/lockdown/absentCapture coverage; their ambient halves moved into hostileSlotRows.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T22:02:48.727Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "deviation",
    "phase": "04.1",
    "file": ".planning/phases/04.1-migrate-measurement-from-plausible-to-posthog/04.1-10-PLAN.md",
    "line": null,
    "description": "04.1-10 Task 2: the plan's call-site criterion is self-contradictory (all 16 sites use the non-occupying shape AND grep installPostHogVendorClient( still reports 15/1). Intent met: 0/0 for the occupying installer, 19/1 for createPostHogVendorClient, no call site deleted.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T22:02:48.872Z",
    "resolved_at": null
  },
  {
    "id": 23,
    "kind": "unmet-truth",
    "phase": "04.1",
    "file": ".github/workflows/deploy.yml",
    "line": null,
    "description": "Deploy workflow reads VITE_HAOO_MEASUREMENT_PROVIDER/TOKEN/API_HOST, but the three GitHub Actions repository variables are NOT confirmed created — an absent variable fails the selector closed to none and the deploy captures nothing while every gate passes",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T22:24:21.297Z",
    "resolved_at": null
  },
  {
    "id": 24,
    "kind": "deviation",
    "phase": "04.2",
    "file": ".planning/phases/04.2-split-haoo-into-its-own-repository-and-domain/04.2-SPLIT-CONTRACT.md",
    "line": null,
    "description": "Q3: recorded root-level asset directory 'assets/' collides with Vite's default build.assetsDir; build-output.test.ts scans every file under dist/assets as a build output. Owner must amend or confirm before plan 04.2-02 moves any file.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-05T20:53:06.945Z",
    "resolved_at": "2026-09-05T20:59:37.216Z"
  },
  {
    "id": 25,
    "kind": "deviation",
    "phase": "04.2",
    "file": "src/test/measurement-page.test.tsx",
    "line": 258,
    "description": "Twelve bare /products/haoo/ jsdom paths remain in the HAOO suite; :258's pathname assertion cannot move to the root without becoming jsdom's default (04.2-DEFERRED-ITEMS D7)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T22:04:08.271Z",
    "resolved_at": null
  },
  {
    "id": 26,
    "kind": "deviation",
    "phase": "04.2",
    "file": "AGENTS.md",
    "line": 60,
    "description": "HAOO repository's AGENTS.md still describes ZERO-PAPER HUB files that no longer exist in its tree (04.2-DEFERRED-ITEMS D8)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T22:04:08.418Z",
    "resolved_at": null
  },
  {
    "id": 27,
    "kind": "deviation",
    "phase": "04.2",
    "file": "README.md",
    "line": null,
    "description": "04.2-06 left README claiming the retired /products/haoo/ path returns 404; false once 04.2-07 shipped the recovery document. Corrected and gated (D29).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-06T08:44:48.476Z",
    "resolved_at": null
  }
]
````
