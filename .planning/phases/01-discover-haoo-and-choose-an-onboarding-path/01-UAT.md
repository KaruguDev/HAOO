---
status: testing
phase: 01-discover-haoo-and-choose-an-onboarding-path
source: [01-VERIFICATION.md]
started: 2026-08-29T19:48:41Z
updated: 2026-08-29T19:48:41Z
---

## Current Test

number: 1
name: Complete the MVP flow in a browser
expected: |
  A prospect reaches HAOO without getting lost and can choose WhatsApp, phone, email, or manage.haoo.online.
awaiting: user response

## Tests

### 1. Complete the MVP flow in a browser
expected: A prospect reaches HAOO without getting lost and can choose WhatsApp, phone, email, or manage.haoo.online.
result: pending

### 2. Inspect responsive layouts and zoom
expected: The card and page reflow without clipping or horizontal scrolling; mobile/desktop ordering and balance are correct at 320px, 768px, 1024px, desktop, and 200% zoom.
result: pending

### 3. Exercise brochure embedding and fallbacks
expected: Desktop embeds or shows the branded fallback; mobile uses the compact preview; Open and Download remain visible.
result: pending

### 4. Verify keyboard focus and Products anchor landing
expected: Focus is clearly visible on both navy panels and the Products heading lands below the fixed header in both header states.
result: pending

### 5. Compare the generic-shell refactor with the approved experience
expected: Product text, accessible names, layout, and parent-brand casing are indistinguishable from the approved 01-05 experience.
result: pending

### 6. Run the suite from an isolated fresh checkout
expected: With no pre-existing dist, npm ci and npm test succeed and all 63 tests pass.
result: pending

### 7. Verify no-JavaScript fallback activation
expected: All fallback destinations work with JavaScript disabled; with JavaScript enabled only the React onboarding set is user-exposed.
result: pending

### 8. Review judgment-tier prohibitions
expected: Human sign-off confirms transparency, source fidelity, identity failure, focus enforcement, and build freshness prohibitions hold.
result: pending

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
