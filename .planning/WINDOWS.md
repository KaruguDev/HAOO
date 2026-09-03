---
schema_version: 1
open_count: 16
waived_count: 0
fixed_count: 3
total_count: 19
last_updated: 2026-09-03T18:38:40.212Z
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
| 19 | 04.1 | deviation | scripts/generate-haoo-report.mjs | 97 | CLI removed-variable table must keep the four previous-provider names; collides with 04.1-08 whole-tree name gate | open |  | 2026-09-03T18:38:40.212Z |  |

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
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-03T18:38:40.212Z",
    "resolved_at": null
  }
]
````
