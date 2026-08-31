# Phase 3: Build Privacy-Bounded Engagement Context - Pattern Map

**Mapped:** 2026-08-30
**Files analyzed:** 16 new or modified files
**Analogs found:** 16 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/measurement/events.ts` | model / utility | transform | `src/products/types.ts`, `src/pages/ProductPage.tsx` | role-match |
| `src/measurement/campaign.ts` | utility | request-response / transform | `src/products/haoo.ts`, `src/App.tsx` | role + flow match |
| `src/measurement/context.ts` | service / store | CRUD / transform | `src/components/QualifyForm.tsx` | flow-match |
| `src/measurement/index.ts` | service / provider facade | event-driven | `src/products/haoo.ts` | role-match |
| `src/products/types.ts` | model / config | transform | existing declarations in the same file | exact |
| `src/products/haoo.ts` | config | transform | existing qualification configuration in the same file | exact |
| `src/products/copy.ts` | utility | transform | existing copy builders in the same file | exact |
| `src/components/MeasurementDisclosure.tsx` | component | event-driven | `src/components/QualifyForm.tsx` | role + flow match |
| `src/pages/ProductPage.tsx` | component / composition root | event-driven | existing page composition in the same file | exact |
| `src/components/BrochurePanel.tsx` | component | event-driven | existing native controls and fallback state in the same file | exact |
| `src/components/OnboardingChoices.tsx` | component | event-driven | existing native outbound actions in the same file | exact |
| `src/components/QualifyForm.tsx` | component / controller | request-response / event-driven | existing validated submission path in the same file | exact |
| `src/test/measurement.test.ts` | test | transform / CRUD | `src/test/build-output.test.ts`, `src/test/qualify-data.test.ts` | role-match |
| `src/test/measurement-page.test.tsx` | test | event-driven | `src/test/haoo-page.test.tsx` | exact-role |
| `src/test/build-output.test.ts` | test / config guard | batch | existing boundary map in the same file | exact |
| `README.md` | documentation / config | file-I/O | existing `VITE_HAOO_FORM_ENDPOINT` section in the same file | exact |

The four-file `src/measurement/` split is the research recommendation, not a locked filename contract. If the planner combines files, preserve the same roles: pure event vocabulary, pure campaign parsing, pure context validation/reduction, and one browser-I/O facade.

## Pattern Assignments

### `src/measurement/events.ts` (model / utility, transform)

**Analog:** `src/products/types.ts` and the exhaustive icon map in `src/pages/ProductPage.tsx`

**Closed type pattern** (`src/products/types.ts:6-12`):

```typescript
export type ProductCapabilityIcon =
  | 'payments'
  | 'properties'
  | 'leases'
  | 'maintenance'
  | 'marketplace'
  | 'reports';
```

**Exhaustive total-map pattern** (`src/pages/ProductPage.tsx:29-36`):

```typescript
const CAPABILITY_ICONS: Record<ProductCapabilityIcon, LucideIcon> = {
  payments: Wallet,
  properties: Building2,
  leases: ClipboardCheck,
  maintenance: Wrench,
  marketplace: Store,
  reports: BarChart3,
};
```

Copy this finite-contract shape, but derive `MeasurementEventName` from one readonly ten-name tuple and type the disclosure/config map as `Record<MeasurementEventName, string>`. Ordinary call sites should accept only the union; reserve a runtime membership guard for dynamic boundaries. Do not add a property bag, generic payload, queue, or form-value import.

---

### `src/measurement/campaign.ts` (utility, request-response / transform)

**Analog:** `resolveQualifyEndpoint()` in `src/products/haoo.ts` plus the address-bar cleanup in `src/App.tsx`

**Normalize, validate, and fail closed** (`src/products/haoo.ts:30-64`):

```typescript
export function resolveQualifyEndpoint(configuredValue?: string): string {
  const candidate = (configuredValue ?? '').trim();

  if (candidate === '') {
    return QUALIFY_ENDPOINT_FALLBACK;
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'https:' || url.host !== 'formsubmit.co') {
      return QUALIFY_ENDPOINT_FALLBACK;
    }

    return candidate;
  } catch {
    return QUALIFY_ENDPOINT_FALLBACK;
  }
}
```

**History replacement pattern** (`src/App.tsx:180-194`):

```typescript
const [contactSubmitted] = useState(
  () => new URLSearchParams(window.location.search).get('contact') === 'success'
);

useEffect(() => {
  if (contactSubmitted) {
    window.history.replaceState({}, '', `${window.location.pathname}#contact`);
  }
}, [contactSubmitted]);
```

Follow the same order for campaign values: trim and lowercase, reject unless the entire candidate matches `[a-z0-9-]+`, then truncate the already-valid value. Accept only `utm_source`, `utm_medium`, and `utm_campaign`; reject duplicates. The measurement facade, not React components, owns `window.location` and catches `replaceState` failures while replacing the URL with the exact clean HAOO route.

---

### `src/measurement/context.ts` (service / store, CRUD / transform)

**Analog:** the pure validation and authoritative-snapshot patterns in `src/components/QualifyForm.tsx`

**Single pure validation seam** (`src/components/QualifyForm.tsx:210-266`):

```typescript
export function validateQualifyValues(
  values: QualifyValues,
  qualify: ProductQualifyForm,
): QualifyErrors {
  const errors: QualifyErrors = {};

  for (const field of qualify.fields) {
    const raw = values[field.name] ?? '';
    const value = raw.trim();

    if (isFieldRequired(field, values) && value === '') {
      errors[field.name] = field.requiredMessage;
      continue;
    }
  }

  return errors;
}
```

**Authoritative in-memory snapshot pattern** (`src/components/QualifyForm.tsx:284-294,339-344`):

```typescript
const [values, setValues] = useState<QualifyValues>(() => seedValues(qualify));
const valuesRef = useRef(values);

function setValue(name: string, value: string) {
  const nextValues = { ...valuesRef.current, [name]: value };

  valuesRef.current = nextValues;
  setValues(nextValues);
}
```

Keep schema parsing, validation, expiry, band derivation, and interaction-flag reduction as pure functions. Reject the whole stored object when JSON, version, exact keys, value domains, capped visit ordinal, or day-only last-seen value is invalid. Browser I/O belongs in `index.ts`; `context.ts` should receive deterministic day/clock input so its roughly-180-day expiry table does not depend on wall-clock time.

The page-memory record is the authority after any storage access/read/write/remove failure. Updates are immutable and flags idempotent. Clearing must reset both the persistent record and page-memory snapshot immediately.

---

### `src/measurement/index.ts` (service / provider facade, event-driven)

**Analog:** centralized public build configuration in `src/products/haoo.ts`

**Build-time configuration boundary** (`src/products/haoo.ts:14-21,67-69`):

```typescript
/**
 * Build-time enquiry destination. `VITE_HAOO_FORM_ENDPOINT` is inlined by Vite and is
 * world-readable in the published bundle by construction; it is obfuscation of the
 * mailbox address, never a secret.
 */
export const QUALIFY_ENDPOINT_FALLBACK = 'https://formsubmit.co/ajax/info@haoo.online';

export const QUALIFY_ENDPOINT = resolveQualifyEndpoint(
  import.meta.env.VITE_HAOO_FORM_ENDPOINT,
);
```

Use one named resolver for a closed, public provider selector. Unset, blank, and unknown values resolve to the no-op sink. The sink signature is event-name-only, and a valid event is discarded immediately when no provider exists: no array, retry, log, or transient buffer.

Expose the small product-facing facade (`initialize`, `track`, `readContext`, `clearContext`, or equivalent). Catch storage, history, and provider exceptions here so none escape to components. Return a discriminated clear result only as needed for truthful UI status; do not expose general storage health.

---

### `src/products/types.ts` and `src/products/haoo.ts` (model/config, transform)

**Analog:** the current product-generic configuration seam

**Readonly product configuration** (`src/products/types.ts:89-102,104-125`):

```typescript
export interface QualifyCollectionNote {
  readonly purpose: string;
  readonly processor: string;
  readonly pageContext: string;
}

export interface ProductQualifyForm {
  readonly endpoint: string;
  readonly subject: string;
  readonly sourceNote: string;
  readonly collectionNote?: QualifyCollectionNote;
  readonly fields: readonly QualifyField[];
  readonly groups: readonly QualifyFieldGroup[];
}
```

**Centralized HAOO values** (`src/products/haoo.ts:175-181,264-293`):

```typescript
export const HAOO_PRODUCT: ProductDefinition = {
  slug: 'haoo',
  name: 'HAOO',
  relationship: 'A ZERO-PAPER HUB product',
  // ...
  contacts: {
    phoneDisplay: '+254 702 188 044',
    // ...
  },
  qualify: {
    endpoint: QUALIFY_ENDPOINT,
    // ...
  },
};
```

Add a readonly, product-generic measurement config shape and populate HAOO's product key, ten events, exhaustive disclosure map, and disclosure copy in `HAOO_PRODUCT`. Keep HAOO literals out of the measurement engine. Do not copy event arrays into the component: render from the total config map keyed by the closed event tuple.

---

### `src/products/copy.ts` (utility, transform)

**Analog:** identity-guarded copy builders in the same file

**Guarded copy pattern** (`src/products/copy.ts:3-13,82-84`):

```typescript
export function requireIdentity(value: string, field: 'name' | 'slug') {
  if (value.trim() === '') {
    throw new Error(`Product ${field} must not be empty`);
  }

  return value;
}

export function qualifyCollectionNotePurpose(productName: string) {
  return `We use these details only to reply to you about ${requireIdentity(productName, 'name')} onboarding. We never sell them or add you to a mailing list.`;
}
```

Replace only the forward-looking `qualifyCollectionNotePageContext()` text/comment with the owner-approved Phase 3 sentence. Preserve identity guarding and keep the FormSubmit processor sentence separate. The locked sentence must render atomically and verbatim; do not build it from conditional clauses.

---

### `src/components/MeasurementDisclosure.tsx` (component, event-driven)

**Analog:** disclosure/status UI in `src/components/QualifyForm.tsx`

**Native data-driven list pattern** (`src/components/QualifyForm.tsx:639-650`):

```tsx
{qualify.groups.map((group) => (
  <fieldset key={group.legend} className="mb-8 border-0 p-0 last:mb-0">
    <legend className="mb-4 text-base font-semibold leading-6 text-[#18275F]">
      {group.legend}
    </legend>
    {group.fieldNames.map((name) => {
      const field = qualify.fields.find((candidate) => candidate.name === name);
      return field ? renderField(field) : null;
    })}
  </fieldset>
))}
```

**Persistently mounted status pattern** (`src/components/QualifyForm.tsx:686-691`):

```tsx
<p role="status" className="mt-4 min-h-[1.5rem] text-sm font-normal leading-[1.4] text-[#5F6B84]">
  {statusMessage}
</p>
```

Implement native `<details id={`${slug}-measurement-disclosure`}>` with `<summary>` first. Keep it uncontrolled and collapsed by default; do not mirror `open` in React or add redundant ARIA/key handlers. Render the exact fixed order from `03-UI-SPEC.md` using semantic paragraphs and visible-bullet lists.

The clear button is native `type="button"`, uses the existing light focus-ring classes, calls only `clearContext()`, and updates a dedicated mounted `role="status"` region. Use the exact success/blocked strings from the UI contract. The component must not import or inspect `localStorage`, URL, history, analytics, or form values.

---

### `src/pages/ProductPage.tsx` (component / composition root, event-driven)

**Analog:** existing product-generic assembly and native footer links in the same file

**Composition seam** (`src/pages/ProductPage.tsx:190-208`):

```tsx
<section id="brochure" aria-label="Brochure" className="scroll-mt-4 bg-white py-12 md:py-16">
  <div className={containerClasses}>
    <h2 className={headingClasses}>Brochure</h2>
    <BrochurePanel brochure={product.brochure} productName={product.name} />
  </div>
</section>

<QualifyForm
  qualify={product.qualify}
  contacts={product.contacts}
  productName={product.name}
  slug={product.slug}
/>
```

**Footer fragment-link pattern** (`src/pages/ProductPage.tsx:219-226`):

```tsx
<div className="flex flex-wrap gap-2">
  <a className={`${footerLinkClasses} text-[#4054C6]`} href={product.contacts.phoneHref}>
    {product.contacts.phoneDisplay}
  </a>
  <a className={`${footerLinkClasses} text-green-800`} href="/">
    Back to ZERO-PAPER HUB
  </a>
</div>
```

Initialize measurement/page view once at the page boundary and pass only typed methods/config downward. Guard the StrictMode page-view effect so a single page instance emits once. Add the native `#haoo-measurement-disclosure` footer anchor before `Back to ZERO-PAPER HUB`; its named handler sets the target `HTMLDetailsElement.open = true` without `preventDefault`, focus movement, or replacing the native fragment destination.

---

### `src/components/BrochurePanel.tsx` and `src/components/OnboardingChoices.tsx` (components, event-driven)

**Analog:** independent native controls already present in these files

**Brochure actions** (`src/components/BrochurePanel.tsx:67-91`):

```tsx
<a
  href={brochure.pdfHref}
  target="_blank"
  rel="noopener"
  className={/* existing native action classes */}
>
  Open brochure
</a>

<a href={brochure.pdfHref} download={brochure.downloadName}>
  Download brochure
</a>
```

**Repeated onboarding actions** (`src/components/OnboardingChoices.tsx:26-45,54-60`):

```tsx
export default function OnboardingChoices({ product, position }: OnboardingChoicesProps) {
  const onDark = position === 'opening' || position === 'closing';

  return (
    <section aria-label={POSITION_LABELS[position]}>
      <a href={product.contacts.whatsappHref}>...</a>
      <a href={product.contacts.phoneHref}>...</a>
      <a href={product.contacts.emailHref}>...</a>
      <a href={product.contacts.selfOnboardingHref}>...</a>
    </section>
  );
}
```

Add named click handlers that call `track()` and preserve each anchor's destination/default behavior. Emit outbound actions per activation. For brochure preview, deduplicate the mobile image and desktop object with one shared per-component ref and count the first successful preview-availability observation only. Do not measure disclosure opening.

---

### `src/components/QualifyForm.tsx` (component/controller, request-response / event-driven)

**Analog:** the current validation-admitted transport path

**Correct submit-event seam** (`src/components/QualifyForm.tsx:391-444`):

```typescript
const nextErrors = validateQualifyValues(submittedValues, qualify);

setSubmitted(true);
setErrors(nextErrors);

if (Object.keys(nextErrors).length > 0) {
  setState('idle');
  setAttempts((previous) => previous + 1);
  return;
}

inFlightRef.current = true;
setNotice('');
setState('submitting');

try {
  const response = await fetch(qualify.endpoint, { /* ... */ });
  setState(response.ok ? 'succeeded' : 'failed');
} catch {
  setState('failed');
}
```

Emit `qualify_start` once on the first actual visitor interaction with the form. Emit bare `qualify_submit` only after validation passes and immediately before the network attempt. Never pass `values`, `QualifyValues`, the request body, role/county/bands, or message text to measurement. Render `MeasurementDisclosure` after the visible collection sentence and before the submit control, and preserve the notice ID in `aria-describedby`.

---

### `src/test/measurement.test.ts` (test, transform / CRUD)

**Analog:** table-driven static contracts and mutation-resistant boundary tests in `src/test/build-output.test.ts`

**Finite table iteration** (`src/test/build-output.test.ts:383-399`):

```typescript
for (const [relativePath, forbiddenGroup] of Object.entries(PRODUCT_SOURCE_BOUNDARY)) {
  const source = readText(resolve(ROOT, relativePath));

  expect(source, relativePath).not.toBe('');
  for (const forbidden of forbiddenGroup) {
    expect(source, `${relativePath} :: ${forbidden}`).not.toMatch(forbidden);
  }
}
```

Use exhaustive tables for all ten accepted event names plus rejected dynamic names; campaign keys, duplicates, trim/case, forbidden characters, truncation, and excluded keys; every valid/invalid schema field and extra-key case; visits 1/2/3/4 saturation; date bands and ~180-day expiry; each idempotent flag; and exceptions at localStorage access/get/set/remove and history replacement. Inject the day/clock. Include mutation probes that would fail if invalid campaign characters were stripped or partial stored records were defaulted into validity.

---

### `src/test/measurement-page.test.tsx` (test, event-driven)

**Analog:** `src/test/haoo-page.test.tsx`

**Accessible-query test setup** (`src/test/haoo-page.test.tsx:1-24`):

```typescript
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProductPage from '../pages/ProductPage';
import { HAOO_PRODUCT } from '../products/haoo';

function renderPage() {
  return render(<ProductPage product={HAOO_PRODUCT} />);
}
```

**Repeated placement contract** (`src/test/haoo-page.test.tsx:157-166`):

```typescript
const placements = screen.getAllByRole('region', { name: /onboarding choices/i });
expect(placements).toHaveLength(3);
for (const [name, href] of ONBOARDING_LINKS) {
  const links = screen.getAllByRole('link', { name });
  expect(links).toHaveLength(3);
  expect(links.every((link) => link.getAttribute('href') === href)).toBe(true);
}
```

Render under `StrictMode` and assert one page view and one preview observation. Exercise all three onboarding placements, brochure open/download, first form interaction, valid submit, invalid submit, disclosure cardinality/order, native details semantics, footer expansion without preventing native navigation, idempotent clear, and truthful blocked-clear copy. Simulate storage/history/provider failures and prove the form and every native destination remain usable.

---

### `src/test/build-output.test.ts` (test/config guard, batch)

**Analog:** the current per-file capability map

**Boundary definition** (`src/test/build-output.test.ts:54-89`):

```typescript
const ALWAYS_FORBIDDEN = [
  /dangerouslySetInnerHTML/,
  /localStorage|sessionStorage|document\.cookie|indexedDB/,
  /gtag\(|dataLayer|analytics\./,
  /react-router|createBrowserRouter/,
  /document\.referrer|navigator\.userAgent|window\.location/,
  /supabase/i,
] as const;

const PRODUCT_SOURCE_BOUNDARY: Readonly<Record<string, readonly RegExp[]>> = {
  'src/pages/ProductPage.tsx': FULL_BOUNDARY,
  'src/components/BrochurePanel.tsx': FULL_BOUNDARY,
  // ...
};
```

Add every `src/measurement/` file to the map and narrow grants per file instead of weakening `ALWAYS_FORBIDDEN`. Only the facade/browser adapter may receive storage/analytics/ambient-location capability; pure event/campaign/context files should retain every prohibition they do not require. Add `MeasurementDisclosure.tsx` with `FULL_BOUNDARY`, and keep all existing components on their current rows.

Extend bundle/source scans for forbidden identity/form keys, UUID/cookie/fingerprint/clickstream seams, property-bag delivery, and any provider script when the selector is unset. Keep the test's existing loop/message pattern so failures identify the exact file and regex.

---

### `README.md` (documentation/config, file-I/O)

**Analog:** existing build-variable documentation (`README.md:17-53`)

```markdown
### The `VITE_HAOO_FORM_ENDPOINT` variable

The submission endpoint is read at build time from the GitHub Actions repository variable
`VITE_HAOO_FORM_ENDPOINT`, which the deploy workflow passes to its `Build` step.

### This value is not a secret

Vite statically inlines `VITE_*` values into the published JavaScript bundle...
```

Document the measurement provider selector beside this precedent: its exact variable name, finite accepted values, unset/blank/unknown no-op behavior, and the fact that it is public build data rather than a secret. State clearly that Phase 3 ships no analytics SDK/account, sends no event properties, and queues nothing. Do not imply live aggregate reporting or Phase 4 email summaries exist.

## Shared Patterns

### Product-generic configuration

**Source:** `src/products/types.ts:104-125` and `src/products/haoo.ts:175-293`

Apply to: `events.ts`, `index.ts`, `types.ts`, `haoo.ts`, `MeasurementDisclosure.tsx`.

Keep generic shapes readonly and put every HAOO literal in `HAOO_PRODUCT`. Components receive config through props and call typed APIs; they do not reconstruct product keys, event lists, disclosure lines, or storage keys.

### Fail closed for data, fail open for the journey

**Source:** `src/products/haoo.ts:30-64` and `src/components/QualifyForm.tsx:422-443`

Apply to: all measurement code and call sites.

Reject invalid event names, campaign values, and stored records. Catch browser/provider failures at the measurement seam, retain a bounded page-memory record, and allow the page, form, brochure, and onboarding links to continue. Components must not branch on analytics/storage availability.

### Native semantics and stable status regions

**Source:** `src/components/QualifyForm.tsx:663-672,686-691` and `src/pages/ProductPage.tsx:219-226`

Apply to: `MeasurementDisclosure.tsx`, `ProductPage.tsx`, all outbound instrumentation.

Preserve native buttons/anchors and their default destinations. Use native `details`/`summary`; do not reimplement disclosure keyboard semantics. Mount status regions from first render and change only their text. Reuse the existing `min-h-11` and `focus-visible:ring-[#4054C6]` patterns.

### One-shot observation, per-activation intent

**Source:** `src/main.tsx` StrictMode root (documented by research) and `src/components/BrochurePanel.tsx:30-64` dual responsive preview nodes.

Apply to: page view, brochure preview, qualification start, and outbound clicks.

Use per-instance refs to deduplicate observation-style events; make flag reducers idempotent. Do not deduplicate deliberate outbound clicks across the three onboarding placements.

### Static capability enforcement

**Source:** `src/test/build-output.test.ts:35-89,383-399`

Apply to: every product and measurement source.

Grant the minimum forbidden-token exception per file. The measurement seam is an auditable capability boundary, not permission to remove storage/analytics/location checks globally.

### Verification style

**Source:** `src/test/haoo-page.test.tsx:157-166,271-300` and `src/test/build-output.test.ts:383-425`

Apply to: both new tests and the extended build test.

Prefer role/name queries, exact cardinality, exact native destinations, table-driven closed sets, repeated-activation checks, and failure-path assertions. Verify no measurement failure disables or rewrites a native journey control.

## No Analog Found

No exact in-repository implementation exists for Web Storage lifecycle management, a measurement provider/sink, campaign query allowlisting, or native `details`/`summary`. The analogs above cover the project's typing, validation, error containment, UI, configuration, and test conventions; use `03-RESEARCH.md` Patterns 1-5 for the browser-specific algorithms.

| File/Concern | Role | Data Flow | Reason |
|--------------|------|-----------|--------|
| `src/measurement/context.ts` browser storage adapter | store | CRUD | No production source currently uses Web Storage. |
| `src/measurement/index.ts` event sink | provider facade | event-driven | No analytics SDK or sink exists. |
| `src/measurement/campaign.ts` query allowlist | utility | request-response / transform | `App.tsx` strips one known query flag but does not validate campaign input. |
| `src/components/MeasurementDisclosure.tsx` native disclosure | component | event-driven | No existing `details`/`summary` component exists. |

## Metadata

**Analog search scope:** `src/`, `README.md`, `vite.config.ts`, `package.json`
**Files scanned closely:** 13 source/config/test files; repository file list scanned in full
**Strong analog families retained:** 5 (product data/types, pure validation/config, semantic component UI, product-page composition, static/component tests)
**Pattern extraction date:** 2026-08-30

