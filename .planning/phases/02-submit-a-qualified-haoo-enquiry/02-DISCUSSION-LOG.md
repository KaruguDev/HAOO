# Phase 2: Submit a Qualified HAOO Enquiry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-30
**Phase:** 2-Submit a Qualified HAOO Enquiry
**Areas discussed:** Submission mechanism, Form placement & entry, Qualification fields, Feedback/spam/disclosure

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Submission mechanism | Native POST + redirect vs AJAX; determines LEAD-05 value retention | ✓ |
| Form placement & entry | Inline section vs own route vs modal; relation to WhatsApp-first onboarding | ✓ |
| Qualification fields | Which fields, required set, controlled option values | ✓ |
| Feedback, spam & disclosure | Validation timing, states, honeypot/captcha posture, LEAD-03 disclosure | ✓ |

**User's choice:** All four areas.
**Notes:** Flagged up front that LEAD-05's "retains entered values after a recoverable error" is unachievable with the existing redirect-based POST pattern, making the submission mechanism the load-bearing decision.

---

## Submission Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| AJAX POST, stay on page | fetch() to FormSubmit AJAX endpoint; in-page states; values survive failure; new pattern for this codebase | ✓ |
| Native POST + redirect back | Mirrors existing contact form exactly; zero new patterns; provider failure loses input | |
| Native POST with AJAX progressive enhancement | Works without JS, AJAX when available; best resilience, two paths to test | |

**User's choice:** AJAX POST, stay on page.

| Option | Description | Selected |
|--------|-------------|----------|
| Direct contact fallback | Failure shows WhatsApp/phone/email panel; consistent with Phase 1 no-JS resilience rule | ✓ |
| mailto: fallback with prefilled body | Preserves typed values; unreliable on mobile | |
| Both — contacts plus mailto | Contacts lead, mailto secondary | |

**User's choice:** Direct contact fallback.

| Option | Description | Selected |
|--------|-------------|----------|
| Replace form with confirmation | Success panel with what was received, response time, WhatsApp alternative; blocks double submit | ✓ |
| Keep form, show status message above | Less disruptive; invites duplicate submissions | |
| Confirmation plus next-step nudge | Also pushes self-onboarding at manage.haoo.online | |

**User's choice:** Replace form with confirmation.

| Option | Description | Selected |
|--------|-------------|----------|
| Random-token endpoint via env var | Keeps info@haoo.online out of the bundle; adds a deploy-config step | ✓ |
| Plain address endpoint | Matches CONTACT_FORM_ENDPOINT today; address visible in built JS | |
| You decide | Defer to researcher/planner | |

**User's choice:** Random-token endpoint via env var.
**Notes:** Endpoint activation itself is Phase 5 (LEAD-07), not Phase 2.

| Option | Description | Selected |
|--------|-------------|----------|
| HAOO-only recipient, ZPH noted in body | Matches HAOO's own contact identity constraint | ✓ |
| HAOO recipient with ZPH cc | Parent-company visibility; needs second activation | |

**User's choice:** HAOO-only recipient, ZPH noted in body.

---

## Form Placement & Entry

| Option | Description | Selected |
|--------|-------------|----------|
| New section on the HAOO page | #qualify section inside /products/haoo/; no new routing | ✓ |
| Its own route, /products/haoo/enquire/ | Cleaner focus; second static route to build and verify | |
| Modal/dialog from a CTA | Shorter page; adds focus-trap accessibility work | |

**User's choice:** New section on the HAOO page.

| Option | Description | Selected |
|--------|-------------|----------|
| Between brochure and closing onboarding | Story → brochure → form, with onboarding choices still last (D-11) | ✓ |
| Replace the closing onboarding block | Strongest conversion focus; weakens repeated onboarding choices | |
| Right after the mid-page onboarding block | Catches peak interest; pushes the form on undecided readers | |

**User's choice:** Between brochure and closing onboarding.

| Option | Description | Selected |
|--------|-------------|----------|
| Add a fourth "Send details" link to all three blocks | WhatsApp stays visually primary per D-10 | ✓ |
| Only mid-page and closing blocks link to it | Keeps the hero uncrowded | |
| No links — section stands alone | Least disruption; form easy to miss | |

**User's choice:** Add a fourth "Send details" link.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, own nav item | Returning visitors jump straight there | ✓ |
| No — keep nav as-is | Avoids mobile nav growth | |
| You decide | Defer to planner | |

**User's choice:** Yes, as its own nav item.

| Option | Description | Selected |
|--------|-------------|----------|
| Consultation invitation | Extends D-12 framing; written version of assisted onboarding | ✓ |
| Practical "request onboarding help" | Plainer and task-focused; less warm | |
| Qualification framing | Most transparent about why fields exist; can feel like screening | |

**User's choice:** Consultation invitation.

| Option | Description | Selected |
|--------|-------------|----------|
| Product-generic component, HAOO config | Follows Phase 1 product-shell precedent; reusable for future products | ✓ |
| HAOO-specific component | Less speculation; likely refactor later | |

**User's choice:** Product-generic component, HAOO config.

---

## Qualification Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Email required, phone optional | Simplest to validate; may cost submissions in a WhatsApp-first market | ✓ |
| Phone required, email optional | Aligns with D-10 WhatsApp-first; looser validation | |
| Either one required, both offered | Truest reading of LEAD-01; needs cross-field validation | |
| Both required | Maximum reachability, highest friction | |

**User's choice:** Email required, phone optional.

| Option | Description | Selected |
|--------|-------------|----------|
| Ask preferred channel | WhatsApp / call / email; follow-up lands where the prospect wants | ✓ |
| Don't ask — infer from fields filled | Fewer fields; ambiguous when both filled | |

**User's choice:** Ask preferred channel.
**Notes:** Raised the resulting gap — preferring WhatsApp while phone stays optional makes the chosen channel unreachable.

| Option | Description | Selected |
|--------|-------------|----------|
| Phone required when WhatsApp/call chosen | Conditional requirement, announced accessibly | ✓ |
| Keep phone optional, note email fallback | Simpler; preference can go unmet | |
| Make phone required for everyone | Friction on every submission for a subset case | |

**User's choice:** Phone becomes required when WhatsApp/call chosen.

| Option | Description | Selected |
|--------|-------------|----------|
| 1-5 / 6-20 / 21-50 / 51-200 / 200+ | Spans individual landlord to large manager; coarse enough for Phase 3 | ✓ |
| Three broad bands | Least friction, weaker routing signal | |
| You decide | Defer to researcher checking brochure tiers | |

**User's choice:** Five bands.

| Option | Description | Selected |
|--------|-------------|----------|
| Kenyan county select + "Outside Kenya" | Controlled, no free text, coarse enough for Phase 3 | ✓ |
| Broad region select | Shortest list, coarsest signal | |
| Major-cities select plus Other | Matches the market; loses detail elsewhere | |

**User's choice:** Kenyan county select + "Outside Kenya".

| Option | Description | Selected |
|--------|-------------|----------|
| Role select required, organization optional text | Role drives routing; individual landlords have no organization | ✓ |
| Both required | Forces landlords to invent an organization name | |
| Role select only, drop organization | Under-delivers LEAD-02 | |

**User's choice:** Role select required, organization optional text.

| Option | Description | Selected |
|--------|-------------|----------|
| Ready now / 1-3 months / 3+ months / Exploring | Separates urgent prospects from researchers | ✓ |
| Three bands: Now / Soon / Just exploring | Least friction, coarsest prioritization | |
| You decide | Defer to planner | |

**User's choice:** Four timeframe bands.

| Option | Description | Selected |
|--------|-------------|----------|
| Optional short message | Fits D-12 consultation framing; must stay email-only per Phase 3 free-text rule | ✓ |
| No message field | Uniformly parseable email; loses consultation context | |
| Required message | Richest context, highest abandonment | |

**User's choice:** Optional short message.

---

## Feedback, Spam & Disclosure

| Option | Description | Selected |
|--------|-------------|----------|
| On submit, plus re-validate on correction | Inline messages, error summary, focus to first problem; predictable for screen readers | ✓ |
| On blur, per field | Immediate but accusatory on partial input; noisier announcements | |
| Native browser validation only | Least code; inconsistent and weak for assistive tech | |

**User's choice:** On submit, plus re-validate on correction.

| Option | Description | Selected |
|--------|-------------|----------|
| Single live region + disabled submit | role="status" for states, role="alert" for errors; matches existing pattern | ✓ |
| Live region plus focus move on completion | Stronger for screen readers; can disorient sighted keyboard users | |
| You decide | Defer to UI spec and existing conventions | |

**User's choice:** Single live region + disabled submit.

| Option | Description | Selected |
|--------|-------------|----------|
| Honeypot only, captcha disabled | Zero friction, no third-party challenge; weaker against determined bots | ✓ |
| Honeypot plus FormSubmit captcha | Strongest filtering; burdens assistive-tech users, tension with LEAD-06 and privacy stance | |
| Honeypot plus timing check | No visible friction; can misfire on autofill | |

**User's choice:** Honeypot only, captcha disabled.

| Option | Description | Selected |
|--------|-------------|----------|
| Plain-language note near submit | Honest summary of what is and isn't sent; Phase 3 refines wording | ✓ |
| Expandable "what we collect" detail | More transparent, but cannot be accurate before Phase 3 | |
| Defer disclosure to Phase 3 | Not viable — LEAD-03 is a Phase 2 requirement | |

**User's choice:** Plain-language note near submit.

| Option | Description | Selected |
|--------|-------------|----------|
| Mark optional fields, note the rest are required | Less visual noise on a mostly-required form; matches existing contact form | ✓ |
| Mark required fields with explained asterisk | Conventional; marker on almost every label here | |

**User's choice:** Mark optional fields.

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing yet — disclosure only | Keeps Phase 2 scope clean; no misleading placeholder | ✓ |
| Reserve a labelled empty section in the email | Known slot for Phase 3; looks odd in real enquiries meanwhile | |

**User's choice:** Nothing yet — disclosure only.

---

## Claude's Discretion

No decisions were explicitly delegated — every "You decide" option offered was declined in favour of a specific choice. Downstream agents retain implicit discretion over component boundaries, field order and grouping, character limits and autoComplete attributes, exact copy wording, spacing, typography, responsive breakpoints, and the specific structure of the FormSubmit request.

## Deferred Ideas

- ZERO-PAPER HUB cc on HAOO enquiries — rejected for v1; revisit if parent-company visibility is needed.
- Expandable "what we collect" signal list — revisit in Phase 3 once actual signals are defined.
- Progressive-enhancement plain-POST fallback — revisit only if no-JS traffic proves meaningful.
- Timing-based bot check — revisit only if the honeypot proves insufficient.
