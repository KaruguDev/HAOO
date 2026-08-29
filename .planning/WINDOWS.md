---
schema_version: 1
open_count: 4
waived_count: 0
fixed_count: 0
total_count: 4
last_updated: 2026-08-29T09:32:59.971Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | src/products/haoo.ts | 10 | Wave 0 HAOO_PRODUCT intentionally contains typed placeholder facts and empty story collections until Plans 01-02 and 01-03. | open |  | 2026-08-29T09:32:59.474Z |  |
| 2 | 01 | stub | src/components/ProductsSection.tsx | 10 | Wave 0 ProductsSection intentionally renders only a placeholder landmark until Plan 01-04. | open |  | 2026-08-29T09:32:59.636Z |  |
| 3 | 01 | stub | src/pages/ProductPage.tsx | 10 | Wave 0 ProductPage intentionally renders only compile-safe placeholder landmarks until Plans 01-02, 01-03, and 01-05. | open |  | 2026-08-29T09:32:59.797Z |  |
| 4 | 01 | deviation | vitest.config.ts | 1 | Added the existing React Vite plugin to Vitest and rejected React-is-not-defined output so infrastructure failures cannot satisfy expected RED. | open |  | 2026-08-29T09:32:59.971Z |  |

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
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-29T09:32:59.797Z",
    "resolved_at": null
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
  }
]
````
