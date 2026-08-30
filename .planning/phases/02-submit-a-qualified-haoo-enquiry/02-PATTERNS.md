# Phase 2: Submit a Qualified HAOO Enquiry - Pattern Map

**Mapped:** 2026-08-30
**Files analyzed:** 13 (4 new, 9 modified)
**Analogs found:** 12 / 13

## File Classification

| New/Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `src/components/QualifyForm.tsx` | new | component (form) | request-response | `src/App.tsx:548-623` (contact form) + `src/components/BrochurePanel.tsx` | role-match (composite) |
| `src/components/QualifyFallback.tsx` | new | component (panel) | static/links | `src/components/OnboardingChoices.tsx` | exact |
| `src/products/types.ts` | extend | model (type defs) | static data | itself — `ProductBrochure` / `ProductContacts` | exact |
| `src/products/haoo.ts` | extend | config/data | static data | itself — `brochure` / `contacts` blocks | exact |
| `src/products/copy.ts` | extend | utility (copy fns) | transform | `brochureFallbackBody` / `whatsappActionLabel` | exact |
| `src/components/OnboardingChoices.tsx` | extend | component | static/links | itself (existing 3 links) | exact |
| `src/components/ProductHeader.tsx` | extend | component (nav) | static data | `PRODUCT_LINKS` const, lines 11-16 | exact |
| `src/pages/ProductPage.tsx` | extend | page (composition) | static | `#brochure` section, lines 185-192 | exact |
| `.github/workflows/deploy.yml` | extend | config (CI) | build | no `env:` block exists anywhere | **no analog** |
| `src/vite-env.d.ts` | extend (likely) | config (types) | build | single `/// <reference>` line | partial |
| `src/test/qualify-form.test.tsx` | new | test (component) | request-response | `src/test/haoo-page.test.tsx` | role-match |
| `src/test/build-output.test.ts` | amend | test (guard) | file scan | itself, lines 35-46 + 292-306 | exact |
| `src/test/product-shell-reuse.test.tsx` | amend | test (guard) | file scan | itself, lines 25-33 | exact |
| `src/test/focus-contrast.test.ts` | amend | test (guard) | file scan | itself, lines 22-34 | exact |
| `src/test/haoo-page.test.tsx` | amend/extend | test (contract) | render | itself, lines 6-11, 45-56 | exact |

---

## Pattern Assignments

### `src/components/QualifyForm.tsx` (new component, request-response)

**Primary analogs:** `src/App.tsx:548-623` (FormSubmit fields + honeypot + status), `src/components/BrochurePanel.tsx` (product-generic component with local `useState` recovery), `src/components/OnboardingChoices.tsx` (focus token constants + prop shape).

**Component prop + focus-constant shape — copy from `src/components/BrochurePanel.tsx:1-24`:**
```tsx
import { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { brochureFallbackBody } from '../products/copy';
import type { ProductBrochure } from '../products/types';

interface BrochurePanelProps {
  readonly brochure: ProductBrochure;
  readonly productName: string;
}

const FALLBACK_HEADING = 'Brochure preview unavailable';
const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const surfaceClasses = 'rounded-2xl border border-[#DFE4F0] bg-[#E9EDFF] p-6 text-[#18275F]';
```
Mirror exactly: `readonly` props, product data passed *in* (never imported), module-level UPPERCASE copy constants, `focusClasses` string constant reused per control. `QualifyForm` takes `{ readonly qualify: ProductQualifyForm; readonly contacts: ProductContacts; readonly productName: string }` so it holds no `HAOO` literal.

**Focus tokens — copy verbatim from `src/components/OnboardingChoices.tsx:16-17`:**
```tsx
const focusLight = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2';
const focusDark = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18275F]';
```
Do **not** introduce a named Tailwind ring colour — `focus-contrast.test.ts:22-25` recognizes only `white` and `blue-700` and throws on anything else.

**Honeypot — copy verbatim from `src/App.tsx:564-573`, changing only the id:**
```tsx
<div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
  <label htmlFor="contact-website">Leave this field blank</label>
  <input
    id="contact-website"
    type="text"
    name="_honey"
    tabIndex={-1}
    autoComplete="off"
  />
</div>
```
Change `contact-website` → `qualify-website`. Keep off-screen positioning (not `display:none`), the real `<label>`, `tabIndex={-1}`, and `autoComplete="off"`.

**Field markup + "(optional)" convention — copy from `src/App.tsx:587-590`:**
```tsx
<label htmlFor="contact-organization" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
  Organization <span className="normal-case font-normal text-gray-400">(optional)</span>
</label>
<input id="contact-organization" type="text" name="organization" placeholder="Your company name"
  autoComplete="organization" maxLength={120} className="w-full px-4 py-3 rounded-xl border …" />
```
Keep: `label`/`htmlFor` on every control, `(optional)` span for optional fields only (D-21), native `autoComplete`/`maxLength`/`required`. Replace the green `focus:ring-green-400` styling with the product-page `#4054C6` focus token above, since this component lives on the product surface.

**Submit button disable + relabel — copy from `src/App.tsx:619-622`:**
```tsx
<button type="submit" disabled={contactSubmitting}
  className="w-full py-3.5 rounded-xl … disabled:cursor-wait disabled:opacity-70">
  {contactSubmitting ? 'Sending…' : 'Send Message'}
</button>
```
Reuse the `disabled` + ternary-label shape (D-23). Restyle to the product palette (`bg-[#4054C6] hover:bg-[#3345A7] active:bg-[#29388A]`, `min-h-11`) per `OnboardingChoices.tsx:34`.

**Live region — DO NOT copy `src/App.tsx:575-586`.** That analog is a known defect for this phase:
```tsx
{contactSubmitted && (
  <div role="status" className="flex items-start gap-3 rounded-xl border border-green-200 …">
```
Conditional mounting works there only because the `_next` redirect reloads the page. Under D-01's in-page flow it silently drops announcements. Render instead, unconditionally from first paint:
```tsx
<p role="status" className="min-h-[1.5rem] text-sm">{statusMessage}</p>
```
with `statusMessage` `''` when idle. Exactly one `role="status"`; a separate `role="alert"` node for the error summary.

**Submission state machine + payload builder** — no in-repo analog (the existing form is native-POST). Use RESEARCH.md Pattern 1 and Pattern 3 verbatim. Never call `response.json()`; branch on `response.ok` only.

**Error/recovery panel structure — copy the shape from `src/components/BrochurePanel.tsx:36-46`:**
```tsx
{showPreview ? (
  <img … onError={() => setPreviewFailed(true)} … />
) : (
  <p className={`${surfaceClasses} text-base font-normal leading-6`}>{PREVIEW_ERROR}</p>
)}
```
Local `useState` boolean drives a recovery surface using `surfaceClasses`, and the independent native controls remain siblings in every state (BrochurePanel comment lines 68-72). The failed/succeeded states must likewise never remove the direct-contact links.

---

### `src/components/QualifyFallback.tsx` (new component, static/links)

**Analog:** `src/components/OnboardingChoices.tsx:29-46`

**Contact-link triad to adapt:**
```tsx
<a href={product.contacts.whatsappHref} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4054C6] px-4 py-3 … ${focusLight}`}>
  <MessageCircle aria-hidden="true" size={18} />
  {whatsappActionLabel(product.name)}
</a>
<a href={product.contacts.phoneHref} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 … ${focusLight}`}>
  <Phone aria-hidden="true" size={18} />
  Call {product.contacts.phoneDisplay}
</a>
<a href={product.contacts.emailHref} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 … ${focusLight}`}>
  <Mail aria-hidden="true" size={18} />
  Email {product.contacts.email}
</a>
```
Copy the structure, `min-h-11` target size, `aria-hidden="true"` on every lucide icon, and `size={18}`.

**MUST NOT copy the accessible names.** `haoo-page.test.tsx:6-11` pins `Chat with HAOO on WhatsApp`, `Call +254 702 188 044`, `Email info@haoo.online`, `Start with HAOO` to exactly three occurrences (asserted at lines 155-165 and again in the media tests), and `product-shell-reuse.test.tsx:115-120` pins the ZENITH equivalents to 3. Build new distinct names from new `copy.ts` helpers (e.g. `Message HAOO on WhatsApp instead`).

---

### `src/products/types.ts` (extend, model)

**Analog:** itself — the `ProductContacts` / `ProductBrochure` / `ProductDefinition` blocks.

**Interface conventions to match (lines 25-47):**
```ts
export interface ProductContacts {
  readonly phoneDisplay: string;
  readonly phoneNumber: string;
  readonly emailHref: string;
  readonly whatsappHref: string;
}

export interface ProductBrochure {
  readonly pdfHref: string;
  readonly downloadName: string;
  readonly expectationLabel: string;
}
```
Every property `readonly`; arrays typed `readonly T[]` (see `ProductDefinition.audiences: readonly string[]`, `capabilities: readonly ProductCapability[]`); string-union types declared as exported `type` aliases like `ProductCapabilityIcon` (lines 5-12). Add `readonly qualify: ProductQualifyForm;` as a new field on `ProductDefinition` following the `brochure` entry, and mirror `ProductCapabilityIcon`'s union style for `QualifyControl`.

---

### `src/products/haoo.ts` (extend, config/data)

**Analog:** itself — the `contacts` and `brochure` blocks (lines 95-118).

```ts
const WHATSAPP_STARTER_TEXT =
  'Hello HAOO, I would like help choosing the best way to get started.';
const PHONE_NUMBER = '254702188044';

export const HAOO_PRODUCT: ProductDefinition = {
  …
  contacts: {
    email: 'info@haoo.online',
    emailHref: 'mailto:info@haoo.online',
    whatsappHref: `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(WHATSAPP_STARTER_TEXT)}`,
  },
  brochure: { pdfHref: '/products/haoo/HAOO-Marketing-Brochure.pdf', … },
};
```
Match: module-level UPPERCASE constants for values reused inside the object, derived values computed inline with template literals, nested object literals per concern. Add the `qualify:` block the same way, with the endpoint derived from `import.meta.env.VITE_HAOO_FORM_ENDPOINT ?? 'https://formsubmit.co/ajax/info@haoo.online'` hoisted to a module constant — note this is the first `import.meta.env` use in the repo and requires amending `build-output.test.ts`'s `/formsubmit/` guard for this file.

---

### `src/products/copy.ts` (extend, utility/transform)

**Analog:** the entire file — every export is a product-name-parameterised pure function.

```ts
function requireIdentity(value: string, field: 'name' | 'slug') {
  if (value.trim() === '') {
    throw new Error(`Product ${field} must not be empty`);
  }
  return value;
}

export function brochureFallbackBody(productName: string) {
  return `You can still open the ${requireIdentity(productName, 'name')} brochure in a new tab or download the PDF.`;
}
```
Every new qualify/fallback/confirmation copy helper must route the product name through `requireIdentity` (`product-shell-reuse.test.tsx` has a "fails closed when a product identity is empty" test that iterates the name builders — add new builders to that list). The file must contain **no `HAOO` literal**; `product-shell-reuse.test.tsx:137-153` scans it case-insensitively.

---

### `src/components/ProductHeader.tsx` (extend, nav)

**Analog:** lines 11-16 — add a fifth entry, no other change needed since both desktop and mobile navs map the same array:
```tsx
const PRODUCT_LINKS = [
  { label: 'Benefits', href: '#benefits' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Brochure', href: '#brochure' },
  { label: 'Onboarding', href: '#onboarding' },
] as const;
```
`as const` array, `key={link.href}`. `haoo-page.test.tsx:50-56` loops a hardcoded name list — extend it there too.

---

### `src/pages/ProductPage.tsx` (extend, page composition)

**Analog:** the `#brochure` section, lines 185-192:
```tsx
<section id="brochure" aria-label="Brochure" className="scroll-mt-4 bg-white py-12 md:py-16">
  <div className={containerClasses}>
    <h2 className={headingClasses}>Brochure</h2>
    <p className={`mt-4 max-w-[680px] ${bodyClasses}`}>{brochureLead(product.name)}</p>
    <BrochurePanel brochure={product.brochure} productName={product.name} />
  </div>
</section>
```
Copy exactly: `id` + `aria-label` + `scroll-mt-4` + alternating surface + `py-12 md:py-16`; `containerClasses` / `headingClasses` / `bodyClasses` module constants (lines 25-27); `max-w-[680px]` on body copy; lead text from a `copy.ts` helper; the child component receives narrow slices of `product`, not the whole object where avoidable. Insert `<section id="qualify" aria-label="…">` between `#brochure` (line 185) and `#onboarding` (line 193), and pick an `aria-label` that is not one of `Benefits`/`Capabilities`/`Rental journey`/`Brochure`/`Onboarding` (the ordering assertion at `haoo-page.test.tsx:45-49` filters on that exact list).

---

### `src/test/qualify-form.test.tsx` (new, test)

**Analog:** `src/test/haoo-page.test.tsx:1-25`
```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { HAOO_PRODUCT } from '../products/haoo';

const ONBOARDING_LINKS = [ … ] as const;

function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
}

function brochureRegion() {
  return screen.getByRole('region', { name: 'Brochure' });
}
```
Copy: explicit `vitest` imports (`globals: false`), module-level expectation constants, a `renderPage()` helper, a region-scoping helper, role/accessible-name queries only. Use `fireEvent` — `@testing-library/user-event` is not installed. Add `vi` to the vitest import and `afterEach(() => vi.unstubAllGlobals())` for the `fetch` stub (see RESEARCH.md Code Examples).

---

### Contract-test amendments (`build-output`, `product-shell-reuse`, `focus-contrast`, `haoo-page`)

Each is a data-driven allowlist edit; the pattern is the array literal plus its explanatory JSDoc comment.

`src/test/build-output.test.ts:35-46` (`PRODUCT_SOURCES`) and `:292-306` (forbidden regexes):
```ts
/** Phase 1 product source files — the static boundary later phases may observe but not breach. */
const PRODUCT_SOURCES = [ 'src/pages/ProductPage.tsx', …, 'src/products/types.ts' ];
…
      for (const forbidden of [
        /dangerouslySetInnerHTML/,
        /localStorage|sessionStorage|document\.cookie|indexedDB/,
        /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/,
        /formsubmit|FormData|<form\b/,
      ]) {
        expect(source).not.toMatch(forbidden);
      }
```
Convert the flat array + flat regex list into a per-file prohibition map so the narrowed boundary stays legible; keep the doc comment updated to name Phase 2. Do not delete regexes.

`src/test/focus-contrast.test.ts:28-34` — add the new component files to `FOCUS_SOURCES` (the contract also asserts `pairs.length > 0`, so each added file must actually declare a focus utility).

`src/test/product-shell-reuse.test.tsx:25-33` — add `QualifyForm.tsx` / `QualifyFallback.tsx` to `GENERIC_PRODUCT_SOURCES`.

---

## Shared Patterns

### Focus indicator
**Source:** `src/components/OnboardingChoices.tsx:16-17`
**Apply to:** every new interactive element
```tsx
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4054C6] focus-visible:ring-offset-2'
```
Arbitrary hex only. Named Tailwind ring colours throw in `focus-contrast.test.ts`.

### Touch target + icon convention
**Source:** `src/components/OnboardingChoices.tsx:33-45`, `ProductHeader.tsx:32`
**Apply to:** all new links and buttons
```tsx
<a className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 …">
  <Mail aria-hidden="true" size={18} />
  …
</a>
```
`min-h-11` (or `size-11` for icon-only buttons); every lucide icon carries `aria-hidden="true"` and an explicit `size`.

### Product-generic copy
**Source:** `src/products/copy.ts:1-8`
**Apply to:** every new user-visible string in `QualifyForm.tsx` / `QualifyFallback.tsx`
```ts
function requireIdentity(value: string, field: 'name' | 'slug') { … }
export function whatsappActionLabel(productName: string) {
  return `Chat with ${requireIdentity(productName, 'name')} on WhatsApp`;
}
```

### Static content as module constants
**Source:** `src/components/BrochurePanel.tsx:17-20`, `src/components/ProductHeader.tsx:11-16`
**Apply to:** all fixed copy and option lists
UPPERCASE module-level constants (component-local copy) or `as const` arrays / product data (repeated content), rendered with a stable `key`. Option lists (roles, bands, counties, timeframes, channels) go in `haoo.ts` so tests assert the data directly, not the rendered DOM.

### FormSubmit provider fields
**Source:** `src/App.tsx:549-562`
**Apply to:** `buildSubmissionBody` in `QualifyForm.tsx`
```tsx
<input type="hidden" name="_subject" value="New website enquiry — ZERO-PAPER HUB" />
<input type="hidden" name="_template" value="table" />
<input type="hidden" name="_next" value={CONTACT_SUCCESS_URL} />
<input type="hidden" name="_autoresponse" value="Thank you for contacting ZERO-PAPER HUB. …" />
```
Carry over `_subject` and `_template`; add `_captcha: 'false'` and `_honey`. **Drop** `_next` (D-01) and **drop** `_autoresponse` (non-functional on AJAX + `_captcha=false`). No `_cc` (D-05). Note the shipped disclosure at `src/App.tsx:616` says "Protected by reCAPTCHA" — the qualify form's disclosure must not repeat that claim since captcha is disabled.

### Brand string
**Source:** `src/App.tsx:551`, `src/products/copy.ts:52`
Every new copy string, `aria-label`, and email body value uses `ZERO-PAPER HUB` uppercase.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `.github/workflows/deploy.yml` (`env:` block) | config (CI) | build | The workflow has no `env:` block anywhere; `- name: Build / run: npm run build` at lines 38-39 passes nothing. No environment-backed application setting exists in the repo. Follow RESEARCH.md Pitfall 7 — repository *variable* (not secret) plus a documented fallback constant. |
| Submission state machine / `fetch` payload builder | component logic | request-response | The only existing form is a native `action`+`_next` POST (`src/App.tsx:196-201` uses `checkValidity()` only). Use RESEARCH.md Patterns 1, 3, 4, 5. |
| Error summary + focus-move | component logic | request-response | No error-summary or `useRef` focus-management precedent exists in the codebase. Use the GOV.UK pattern in RESEARCH.md Pattern 4. |
| `src/vite-env.d.ts` `ImportMetaEnv` typing | config (types) | build | File is a single `/// <reference types="vite/client" />`; no custom env typing precedent. |

---

## Metadata

**Analog search scope:** `src/` (App.tsx, components/, products/, pages/, test/), `.github/workflows/`
**Files scanned:** 17 source + test files (2,962 LOC total)
**Pattern extraction date:** 2026-08-30
