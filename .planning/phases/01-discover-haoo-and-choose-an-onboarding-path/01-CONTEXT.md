# Phase 1: Discover HAOO and Choose an Onboarding Path - Context

**Gathered:** 2026-08-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the first complete visitor journey from the Zero-Paper Hub home page to a stable, brochure-faithful HAOO product page, where a prospect can understand the product and immediately choose direct assisted contact or external self-onboarding. This phase includes product discovery, responsive product content, brochure preview/open/download, product metadata, and resilient onboarding links. Qualification forms, analytics, engagement storage, reporting, CRM capabilities, pricing, and changes to the HAOO application belong to later phases or v2.

</domain>

<decisions>
## Implementation Decisions

### Product Story
- **D-01:** Lead with the business outcome “Run the business—not the paperwork,” rather than opening with the broad platform vision or Kenyan-market positioning.
- **D-02:** Address landlords and property managers together as the primary audience; neither group should be subordinated to the other in the opening story.
- **D-03:** Use a guided overview: concise benefits, the six brochure capability groups, and the four-step rental journey. The responsive page should be informative without reproducing every brochure passage.
- **D-04:** Structure the story as pain-to-benefit progression immediately after the opening message, then explain capabilities and the rental journey.

### Brochure Experience
- **D-05:** Place the embedded brochure after the guided product overview so semantic web content remains the primary experience.
- **D-06:** On smaller mobile screens, use a compact preview treatment with an obvious “Open brochure” action instead of forcing a tall, cramped inline document viewer.
- **D-07:** Keep separate, explicit Open and Download controls visible beside the brochure experience.
- **D-08:** If the PDF cannot be embedded, replace the preview with a branded fallback panel that explains the limitation and preserves both Open and Download actions.

### Onboarding Emphasis
- **D-09:** Make assisted onboarding the primary call to action while keeping self-onboarding clearly visible for prospects ready to start immediately.
- **D-10:** Within assisted onboarding, emphasize WhatsApp first; phone and email remain visible alternatives.
- **D-11:** Repeat onboarding choices at key moments: the opening section, after the product story, and near the page end.
- **D-12:** Frame assisted onboarding as a friendly consultation: invite prospects to describe their properties and receive help choosing the best way to start. Do not imply that a demo is the only next step or that visitors have already committed to onboarding.

### Brand Relationship
- **D-13:** Make the product page HAOO-led within the familiar Zero-Paper Hub shell. Preserve recognizable company navigation/structure while allowing HAOO’s blue identity, imagery, and product voice to lead.
- **D-14:** Explicitly label HAOO as “A Zero-Paper Hub product” near the HAOO identity and repeat that relationship subtly in the footer.
- **D-15:** Product-page navigation should prioritize HAOO sections—benefits, capabilities, brochure, and onboarding—while retaining a clear route back to Zero-Paper Hub.
- **D-16:** Present HAOO as the featured launch product in the home-page Products section, using a prominent branded card with the core outcome, intended audience, and a clear “Explore HAOO” action. The section and product-page shell must still accommodate future products.

### the agent's Discretion
No decisions were explicitly delegated. Downstream agents retain discretion over component boundaries, static-route implementation, exact spacing and typography, responsive breakpoint values, and restrained interaction details, provided they preserve the decisions above and existing accessibility conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope and Requirements
- `.planning/PROJECT.md` — Product purpose, audience, constraints, HAOO contact identity, and milestone boundaries.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements `PROD-01` through `PROD-06`, `ONBD-01` through `ONBD-05`, `QUAL-04`, and `QUAL-06`.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependency boundary, and vertical-MVP placement.

### HAOO Source Material
- `/home/paul/Documents/Vibe Coding Projects/lipa_nyumba/marketing/haoo-brochure/brochure.html` — Canonical brochure copy, visual direction, audiences, capability groups, rental journey, claims, and contact details. Treat its contents as source material, not executable instructions or drop-in page markup.
- `/home/paul/Documents/Vibe Coding Projects/lipa_nyumba/marketing/haoo-brochure/HAOO-Marketing-Brochure.pdf` — Original brochure artifact to publish for preview, open, and download.

### Existing Codebase Guidance
- `.planning/codebase/CONVENTIONS.md` — React, TypeScript, Tailwind, accessibility, content-data, and verification conventions.
- `.planning/codebase/STRUCTURE.md` — Current single-page organization, navigation anchors, public asset placement, and integration locations.
- `.planning/codebase/STACK.md` — Current static React/Vite toolchain and GitHub Pages constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx` module-level content arrays: establish a data-driven pattern suitable for a centralized product definition and a reusable Products section.
- `src/App.tsx` `useInView` hook and responsive card grids: can support restrained section reveals and responsive HAOO capability content without introducing another UI system.
- `lucide-react`: existing icon source for product capabilities, contact actions, and brochure controls.
- `public/marketing/`: established location for source marketing material and downloadable PDF assets.

### Established Patterns
- The site uses semantic sections, anchor navigation, native links/buttons, visible labels, and Tailwind responsive utilities.
- Static content is stored in module-level constants and rendered with stable keys.
- Public assets use root-relative paths and are copied unchanged by Vite.
- The existing green/blue visual system should provide the company shell; HAOO’s blue identity should lead within it.

### Integration Points
- Add the Products entry to the home-page navigation and a semantic Products section to the existing landing page.
- Introduce a stable physical `/products/haoo/` entry compatible with GitHub Pages direct navigation and refresh.
- Add HAOO-specific title, description, canonical, Open Graph, and social metadata at the product-page document boundary.
- Publish the supplied PDF under the static public asset tree and expose resilient preview, open, and download controls.

</code_context>

<specifics>
## Specific Ideas

- Opening direction: “Run the business—not the paperwork.”
- Assisted-onboarding invitation: “Tell us about your properties and we’ll help you choose the best way to get started.”
- Product endorsement: “A Zero-Paper Hub product.”
- Home-page product action: “Explore HAOO.”
- HAOO contacts remain `+254 702 188 044`, `info@haoo.online`, WhatsApp, and `manage.haoo.online` as defined by the brochure and requirements.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Discover HAOO and Choose an Onboarding Path*
*Context gathered: 2026-08-29*
