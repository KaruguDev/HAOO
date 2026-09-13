---
status: testing
phase: 05-prove-the-deployed-journey
source: [05-VERIFICATION.md]
started: 2026-09-13T09:01:10.276Z
updated: 2026-09-13T09:01:10.276Z
---

## Current Test

number: 1
name: Option labels at 360 px. On a real phone or at a 360 x 740 viewport on https://www.haoo.online/, open each qualification select (role, portfolio size, location, timeframe, preferred channel) and read every option.
expected: |
  Every option label is fully readable in the closed control and in the open native picker, with no truncation the visitor cannot scroll past.
awaiting: user response

## Tests

### 1. Option labels at 360 px. On a real phone or at a 360 x 740 viewport on https://www.haoo.online/, open each qualification select (role, portfolio size, location, timeframe, preferred channel) and read every option.
expected: Every option label is fully readable in the closed control and in the open native picker, with no truncation the visitor cannot scroll past.
result: [pending]

### 2. E1, line length. At a 640 x 512 and a 720 x 450 viewport (the equivalent of 200% zoom on a desktop), read the paragraph copy in the HAOO page's max-width columns.
expected: The paragraphs read comfortably (measured at 59 to 84 characters per line), not just unclipped.
result: [pending]

### 3. E3, brochure equivalent. At 320 x 256, 360 x 740 and the 200%-equivalent entries, read the capabilities grid (6 cards) and the rental journey (4 steps).
expected: The HTML equivalent of the brochure is complete and readable in one column.
result: [pending]

### 4. KB-O2, keyboard in the embedded PDF viewer. In a desktop Chrome or Firefox with a PDF viewer, Tab into the brochure preview on https://www.haoo.online/ and then Tab or Shift+Tab out again.
expected: Focus can enter and leave the embedded viewer by keyboard, and the Open and Download brochure controls stay reachable before and after it.
result: [pending]

### 5. FS-O1, the status-region wording. Decide whether 05-12's truth 'Exactly one live status region exists' means the form's submission region (1 at every measured transition) or every role="status" element in the document (2 while the form card renders).
expected: The owner accepts the scoping to the submission region, since the second region is MeasurementDisclosure's own clear-context status, or asks for a change.
result: [pending]

### 6. Prohibition wording (05-14, 05-17). R-1, the Kenya DPA 2019 acceptance and the origin-certificate acceptance were recorded as 'owner-accepted, orchestrator-drafted at the owner's request, approved as written'. The plans' judgment-tier prohibitions require 'the owner's own statement'. Confirm that approving the drafted wording satisfies that requirement.
expected: The owner confirms that the approved drafts stand as their statements. If not, the owner supplies their own sentences.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
