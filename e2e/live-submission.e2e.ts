import { randomBytes } from 'node:crypto';

import { expect, test, type Request } from '@playwright/test';

import { APPROVED_ANALYTICS_HOSTS } from '../config/approved-analytics-hosts';
import { recordEvidence } from './fixtures/evidence';
import { SURFACES } from './fixtures/surfaces';

/**
 * THE LIVE SUBMISSION — the single mechanism for every real form submission Phase 5 sends.
 *
 * **This file posts to the production endpoint of a real mailbox.** Every other spec under `e2e/`
 * either issues no request to the form provider or routes it to abort (`e2e/form-states.e2e.ts`
 * FS-0). This one does not: when armed it drives the shipped qualification form on
 * `https://www.haoo.online/` and lets the request reach `formsubmit.co`, which mails
 * `info@haoo.online`. Exactly two such submissions are sent in the whole phase — the endpoint
 * activation trigger (plan 05-06) and the tagged release submission (plan 05-16) — and each is
 * recorded with its own marker and timestamp.
 *
 * **The default state of this file is inert.** It skips unless `HAOO_SEND_LIVE_SUBMISSION` is set to
 * a non-empty value. A routine `npm run test:e2e` or `npm run test:e2e:live` therefore reports it as
 * skipped and sends nothing. The four further guards below exist because "armed" must mean one
 * deliberate send, not "armed, and then whatever the runner decides":
 *
 *   1. The purpose must be named explicitly (`HAOO_LIVE_SUBMISSION_PURPOSE`), so an armed run cannot
 *      send a message whose marker says the wrong thing.
 *   2. The project must be `live`. The preview build resolves the same production endpoint, so an
 *      armed `--project=preview` run would also send real mail; it is skipped instead.
 *   3. Retries are pinned to 0 for this block, overriding the `live` project's `retries: 2`. A retry
 *      after a mid-flight failure would send a second (and third) real message.
 *   4. A run on a retry or repeat index refuses to start, so a `--retries` or `--repeat-each` flag on
 *      the command line cannot defeat guard 3.
 *
 * **What a confirmation may be recorded as.** The confirmation state is a BROWSER-OBSERVABLE claim:
 * this page saw the provider accept the request. It is never a delivery or activation claim. Those
 * are established by the owner's verbatim mailbox record in `05-EVIDENCE-MAIL.md` (D-11, D-13).
 *
 * **Why the analytics event does not count.** The shipped `posthog-js` bot filter drops events when
 * `navigator.webdriver` is true, which it is under Playwright (05-RESEARCH Finding M-1). This spec
 * measures the flag and asserts no request reached the ingestion origin, so the record can state
 * that this submission did not enter the owner's funnel counts.
 *
 * Strings are transcribed as literals rather than imported: `src/products/haoo.ts` reads
 * `import.meta.env` at module scope and throws outside Vite (the constraint `e2e/form-states.e2e.ts`
 * and `e2e/recovery.e2e.ts` record).
 */

/* ------------------------------------------------------------------------------------------- */
/* The marker convention — exported so plan 05-16 reuses it rather than re-deriving it          */
/* ------------------------------------------------------------------------------------------- */

/** The marker purpose for the submission that triggers FormSubmit's activation mail (05-06). */
export const MARKER_PURPOSE_ENDPOINT_ACTIVATION = 'ENDPOINT-ACTIVATION';

/** The marker purpose for the tagged release submission whose delivery is checked (05-16). */
export const MARKER_PURPOSE_RELEASE_VERIFICATION = 'RELEASE-VERIFICATION';

export type MarkerPurpose =
  | typeof MARKER_PURPOSE_ENDPOINT_ACTIVATION
  | typeof MARKER_PURPOSE_RELEASE_VERIFICATION;

const MARKER_PURPOSES: readonly MarkerPurpose[] = [
  MARKER_PURPOSE_ENDPOINT_ACTIVATION,
  MARKER_PURPOSE_RELEASE_VERIFICATION,
];

/**
 * `HAOO-<PURPOSE>-<YYYYMMDD>T<HHMMSS>Z-<8 lowercase hex>`.
 *
 * The format is deliberately narrow. The marker travels in a visitor-visible field to a third party
 * and is stored in a mailbox, so it carries uppercase letters, digits and hyphens only — no
 * free-form text, nothing a caller can inject (threat T-05-24). It must be unique (a UTC instant to
 * the second plus 32 random bits), findable by exact search in a mailbox, and impossible to mistake
 * for a genuine enquiry (no prospect types `HAOO-ENDPOINT-ACTIVATION-…`).
 */
export const MARKER_PATTERN = /^HAOO-[A-Z-]+-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}$/;

/** The instant-and-suffix tail every marker ends with, used to check a purpose unambiguously. */
const MARKER_TAIL = /^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}$/;

/** Build a marker from a UTC instant and an 8-hex-digit random suffix. */
export function buildMarker(
  purpose: MarkerPurpose,
  now: Date = new Date(),
  suffix: string = randomBytes(4).toString('hex'),
): string {
  if (!MARKER_PURPOSES.includes(purpose)) {
    throw new Error(`buildMarker: '${String(purpose)}' is not one of ${MARKER_PURPOSES.join(', ')}`);
  }
  if (!/^[0-9a-f]{8}$/.test(suffix)) {
    throw new Error('buildMarker: the suffix must be exactly 8 lowercase hex digits');
  }
  // '2026-09-13T00:15:07.123Z' -> '20260913T001507Z'
  const instant = `${now.toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`;
  const marker = `HAOO-${purpose}-${instant}-${suffix}`;
  if (!MARKER_PATTERN.test(marker)) {
    throw new Error(`buildMarker: built '${marker}', which does not match ${MARKER_PATTERN.source}`);
  }
  return marker;
}

/** Whether `marker` is well formed AND carries exactly `purpose` (not merely a prefix of it). */
export function markerHasPurpose(marker: string, purpose: MarkerPurpose): boolean {
  const prefix = `HAOO-${purpose}-`;
  return (
    MARKER_PATTERN.test(marker) &&
    marker.startsWith(prefix) &&
    MARKER_TAIL.test(marker.slice(prefix.length))
  );
}

/* ------------------------------------------------------------------------------------------- */
/* The arming contract                                                                           */
/* ------------------------------------------------------------------------------------------- */

/** Unset or blank: the whole describe block is skipped and nothing is sent. */
const ARM_FLAG = 'HAOO_SEND_LIVE_SUBMISSION';

/** Required when armed: one of the two purpose constants above, verbatim. */
const PURPOSE_VARIABLE = 'HAOO_LIVE_SUBMISSION_PURPOSE';

/**
 * Optional when armed: a marker generated and recorded BEFORE the run (plan 05-16 commits its marker
 * before sending). It must match the pattern and the named purpose. When absent, the marker is built
 * at run time and written to the evidence file before the submit control is activated.
 */
const MARKER_VARIABLE = 'HAOO_LIVE_SUBMISSION_MARKER';

const ARMED = (process.env[ARM_FLAG] ?? '').trim() !== '';

function readPurpose(): MarkerPurpose {
  const value = (process.env[PURPOSE_VARIABLE] ?? '').trim();
  const purpose = MARKER_PURPOSES.find((candidate) => candidate === value);
  if (purpose === undefined) {
    throw new Error(
      `${ARM_FLAG} is set, but ${PURPOSE_VARIABLE}='${value}' is not one of ` +
        `${MARKER_PURPOSES.join(', ')}. Refusing to send a submission whose marker would not say what it is.`,
    );
  }
  return purpose;
}

function readOrBuildMarker(purpose: MarkerPurpose): { marker: string; source: string } {
  const supplied = (process.env[MARKER_VARIABLE] ?? '').trim();
  if (supplied === '') {
    return { marker: buildMarker(purpose), source: 'built at run time by buildMarker' };
  }
  if (!markerHasPurpose(supplied, purpose)) {
    throw new Error(
      `${MARKER_VARIABLE}='${supplied}' is not a well-formed ${purpose} marker. Refusing to send.`,
    );
  }
  return { marker: supplied, source: `supplied through ${MARKER_VARIABLE}, recorded before the run` };
}

/* ------------------------------------------------------------------------------------------- */
/* The shipped strings and identifiers                                                           */
/* ------------------------------------------------------------------------------------------- */

const SURFACE = SURFACES.S1;

/** `QualifyForm.tsx` `qualifyId`: `haoo-qualify-${suffix}`. */
function qid(suffix: string): string {
  return `haoo-qualify-${suffix}`;
}

/**
 * `QUALIFY_ENDPOINT_FALLBACK`, `src/products/haoo.ts`. `resolveQualifyEndpoint` returns exactly this
 * for an unset, blank or rejected build variable, and the live bundle `/assets/haoo-C1OXjuEM.js` was
 * measured on 2026-09-13 to carry this one formsubmit.co string and no other.
 */
const EXPECTED_ENDPOINT = 'https://formsubmit.co/ajax/info@haoo.online';

/** The only host `resolveQualifyEndpoint` accepts. */
const PROVIDER_HOST = 'formsubmit.co';

const SUBMIT_LABEL = 'Send my details';
const CONFIRMATION_HEADING = 'Your details are on their way';
const FALLBACK_HEADING = "We couldn't send your details";

/** `QUALIFY_STATUS_MESSAGES.succeeded`, `src/components/qualify-form.logic.ts`. */
const STATUS_SUCCEEDED = 'Your details were sent.';

/** A name no prospect would submit. */
const VERIFICATION_NAME = 'HAOO Release Verification';

/**
 * The reply-to address the form's email control carries. It is the mailbox under test itself —
 * owner-confirmed to exist and owner-readable — so no address outside the owner's control is ever
 * placed in a submission. FormSubmit uses this field as the reply-to; it does not mail it.
 */
const VERIFICATION_EMAIL = 'info@haoo.online';

/** The required selects that take their first non-placeholder option. `preferredChannel` is set to Email. */
const FIRST_OPTION_SELECTS = ['role', 'portfolioBand', 'county', 'timeframe'] as const;

/** The plain-words statement that precedes the marker in the visitor-visible free-text field. */
const NOT_AN_ENQUIRY =
  'This is an automated release verification sent by the HAOO release process. It is not an enquiry and needs no reply.';

const DESKTOP = { width: 1280, height: 1024 } as const;

/** The form's own request timeout is shorter than this; a live round trip plus settling fits. */
const TIMEOUT_MS = 180_000;
const TERMINAL_STATE_TIMEOUT_MS = 60_000;

const EVIDENCE_NAME = 'live-submission';

const INGESTION_ORIGINS = APPROVED_ANALYTICS_HOSTS.map((host) => host.origin);

/** O-2: Cloudflare JavaScript Detections. Recorded when observed; never counted as a submission. */
const CHALLENGE_PATH = '/cdn-cgi/challenge-platform/';

function isProviderRequest(request: Request): boolean {
  try {
    return new URL(request.url()).host === PROVIDER_HOST;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------------------------- */
/* The submission                                                                                */
/* ------------------------------------------------------------------------------------------- */

test.describe('LIVE SUBMISSION — one real submission through the shipped form on the live origin', () => {
  // The guard. Without the flag this block is skipped whole, and no request of any kind is made.
  test.skip(
    !ARMED,
    `${ARM_FLAG} is unset: this spec sends real mail to info@haoo.online and is inert by default`,
  );

  // Guard 3: never retry a send, whatever the project default says.
  test.describe.configure({ retries: 0, timeout: TIMEOUT_MS });

  test('sends exactly one marked submission and records what the browser observed', async ({
    page,
  }, testInfo) => {
    // Guard 2: the preview build posts to the same production endpoint.
    test.skip(
      testInfo.project.name !== SURFACE.playwrightProject,
      'the live submission runs on the live project only; the preview build would also reach production',
    );

    // Guard 4: a retry or repeat would be a second real message.
    if (testInfo.retry !== 0 || testInfo.repeatEachIndex !== 0) {
      throw new Error(
        `refusing to send: retry=${testInfo.retry} repeatEachIndex=${testInfo.repeatEachIndex}. ` +
          'A second attempt needs an explicit, recorded decision, not a runner flag.',
      );
    }

    // Guard 1, then the marker — both before any navigation.
    const purpose = readPurpose();
    const markerGeneratedAt = new Date().toISOString();
    const { marker, source: markerSource } = readOrBuildMarker(purpose);
    const message = `${NOT_AN_ENQUIRY} Marker: ${marker}`;

    // Listeners before navigation, so nothing they exist to catch can be missed.
    const ingestionRequests: string[] = [];
    const challengeRequests: string[] = [];
    const providerRequests: { method: string; url: string; bodyCarriesMarker: boolean }[] = [];
    const providerFailures: { method: string; url: string; failure: string }[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (INGESTION_ORIGINS.some((origin) => url.startsWith(origin))) {
        ingestionRequests.push(url);
      }
      if (url.includes(CHALLENGE_PATH)) {
        challengeRequests.push(url);
      }
      if (isProviderRequest(request)) {
        providerRequests.push({
          method: request.method(),
          url,
          bodyCarriesMarker: (request.postData() ?? '').includes(marker),
        });
      }
    });
    page.on('requestfailed', (request) => {
      if (isProviderRequest(request)) {
        providerFailures.push({
          method: request.method(),
          url: request.url(),
          failure: request.failure()?.errorText ?? '<no error text>',
        });
      }
    });

    await page.setViewportSize(DESKTOP);
    const navigation = await page.goto(SURFACE.path ?? SURFACE.url);
    expect(navigation?.status(), `unexpected status for ${SURFACE.url}`).toBe(200);
    expect(new URL(page.url()).origin, 'the page is not on the live HAOO origin').toBe(
      new URL(SURFACE.url).origin,
    );
    await page.waitForLoadState('load');

    const webdriver = await page.evaluate(() => navigator.webdriver);
    expect(webdriver, 'posthog-js drops bot events on this flag — the funnel exclusion rests on it').toBe(
      true,
    );

    const bundleSources = await page
      .locator('script[src]')
      .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('src') ?? ''));

    const nameControl = page.locator(`#${qid('name')}`);
    await expect(nameControl, 'the qualification form is not on the page').toBeVisible();

    const formControlNames = await page
      .locator('form')
      .first()
      .evaluate((form) =>
        Array.from(form.querySelectorAll('input, select, textarea')).map(
          (control) => control.getAttribute('name') ?? '<unnamed>',
        ),
      );

    // Fill the shipped controls. Nothing is added, hidden or invented.
    await nameControl.fill(VERIFICATION_NAME);
    await page.locator(`#${qid('email')}`).fill(VERIFICATION_EMAIL);
    await page.locator(`#${qid('preferredChannel')}`).selectOption('Email');

    const chosenOptions: Record<string, string> = { preferredChannel: 'Email' };
    for (const name of FIRST_OPTION_SELECTS) {
      const select = page.locator(`#${qid(name)}`);
      const first = await select.evaluate((element) => {
        const option = Array.from((element as HTMLSelectElement).options).find(
          (candidate) => candidate.value !== '' && !candidate.disabled,
        );
        return option?.value ?? '';
      });
      expect(first, `the '${name}' select has no non-placeholder option`).not.toBe('');
      await select.selectOption(first);
      chosenOptions[name] = first;
    }

    const messageControl = page.getByLabel('Anything else we should know?');
    await messageControl.fill(message);

    // The marker is visible to a visitor and reads back out of the control before anything is sent.
    await expect(messageControl, 'the free-text control is not visible').toBeVisible();
    await expect(messageControl, 'the marker does not read back from the free-text control').toHaveValue(
      message,
    );
    const readBack = await messageControl.inputValue();
    const markerReadBack = readBack.includes(marker);
    expect(markerReadBack, 'the marker is absent from the control value').toBe(true);
    expect(providerRequests, 'a provider request was issued before the submit control was activated').toEqual(
      [],
    );

    // The marker is fixed and on disk before the send.
    recordEvidence(EVIDENCE_NAME, {
      surface: SURFACE.id,
      viewport: DESKTOP,
      measured: {
        phase: 'marker fixed, before the submit control was activated',
        purpose,
        marker,
        markerGeneratedAt,
        markerReadBackFromVisibleControl: markerReadBack,
        providerRequestsSoFar: providerRequests.length,
      },
      detail: { plan: purpose === MARKER_PURPOSE_ENDPOINT_ACTIVATION ? '05-06' : '05-16', markerSource },
    });

    // The single send.
    const providerResponse = page
      .waitForResponse(
        (response) => isProviderRequest(response.request()) && response.request().method() === 'POST',
        { timeout: TERMINAL_STATE_TIMEOUT_MS },
      )
      .catch(() => null);

    const sentAt = new Date().toISOString();
    await page.getByRole('button', { name: SUBMIT_LABEL }).click();

    const response = await providerResponse;
    let responseBody = '<no response observed>';
    if (response !== null) {
      try {
        responseBody = (await response.text()).slice(0, 2000);
      } catch (error) {
        responseBody = `<body unreadable: ${String(error)}>`;
      }
    }

    const confirmation = page.getByRole('heading', { name: CONFIRMATION_HEADING });
    const fallback = page.getByRole('heading', { name: FALLBACK_HEADING });
    await expect(confirmation.or(fallback))
      .toBeVisible({ timeout: TERMINAL_STATE_TIMEOUT_MS })
      .catch(() => undefined);

    // Let any late analytics or provider traffic surface before the lists are read.
    await page.waitForTimeout(2000);

    const rendered = await page.evaluate(
      ({ confirmationText, fallbackText }) => {
        const headings = Array.from(document.querySelectorAll('h3')).map((h) =>
          (h.textContent ?? '').trim(),
        );
        const active = document.activeElement;
        const regions = Array.from(document.querySelectorAll('[role="status"]')).map((element) => ({
          text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim(),
          insideForm: element.closest('form') !== null,
        }));
        return {
          terminalHeading: headings.includes(confirmationText)
            ? confirmationText
            : headings.includes(fallbackText)
              ? fallbackText
              : '<neither terminal heading rendered>',
          focusedTag: active === null ? '<none>' : active.tagName,
          focusedText: active === null ? '<none>' : (active.textContent ?? '').trim().slice(0, 200),
          formElements: document.querySelectorAll('form').length,
          statusRegionsInDocument: regions.length,
          submissionRegionTexts: regions.filter((region) => !region.insideForm).map((region) => region.text),
        };
      },
      { confirmationText: CONFIRMATION_HEADING, fallbackText: FALLBACK_HEADING },
    );

    const providerPosts = providerRequests.filter((request) => request.method === 'POST');

    // Everything the browser observed is written BEFORE any assertion, so a failed run still leaves
    // its record: a send that is not recorded cannot be counted.
    recordEvidence(EVIDENCE_NAME, {
      surface: SURFACE.id,
      viewport: DESKTOP,
      measured: {
        phase: 'after the single activation of the submit control',
        purpose,
        marker,
        sentAt,
        submitActivations: 1,
        providerPostCount: providerPosts.length,
        providerRequests,
        providerFailures,
        requestUrl: providerPosts[0]?.url ?? '<no provider POST observed>',
        responseStatus: response?.status() ?? '<no response observed>',
        responseStatusText: response?.statusText() ?? '<no response observed>',
        responseContentType: response?.headers()['content-type'] ?? '<no response observed>',
        responseBody,
        terminalHeading: rendered.terminalHeading,
        focusedElement: `${rendered.focusedTag} "${rendered.focusedText}"`,
        submissionRegionTexts: rendered.submissionRegionTexts,
        statusRegionsInDocument: rendered.statusRegionsInDocument,
        formElementsAfter: rendered.formElements,
        navigatorWebdriver: webdriver,
        ingestionRequests,
        challengePlatformRequests: challengeRequests.length,
        formControlNamesBeforeSend: formControlNames,
        chosenOptions,
        bundleSources,
      },
      detail: {
        plan: purpose === MARKER_PURPOSE_ENDPOINT_ACTIVATION ? '05-06' : '05-16',
        target: `live (${SURFACE.url})`,
        ingestionOrigins: INGESTION_ORIGINS,
        claimBoundary:
          'the confirmation state is a browser-observable claim that the provider accepted the request; it is not a delivery or activation claim and must never be recorded as one',
        challengePlatformNote:
          'O-2: Cloudflare JavaScript Detections requests are counted as observed; they are not submissions',
      },
    });

    // The one-line transcript the recording task copies into 05-EVIDENCE-MAIL.md.
    console.log(
      `LIVE-SUBMISSION ${JSON.stringify({
        marker,
        markerGeneratedAt,
        sentAt,
        providerPostCount: providerPosts.length,
        requestUrl: providerPosts[0]?.url ?? null,
        responseStatus: response?.status() ?? null,
        responseBody,
        providerFailures,
        rendered,
        ingestionRequests,
        challengePlatformRequests: challengeRequests.length,
      })}`,
    );

    // The assertions, after the record.
    expect(providerPosts.length, 'provider POST requests issued by the single submit').toBe(1);

    const posted = new URL(providerPosts[0].url);
    expect(posted.protocol, 'the endpoint is not https').toBe('https:');
    expect(posted.host, 'the endpoint is not on the pinned provider host').toBe(PROVIDER_HOST);
    expect(providerPosts[0].url, 'the endpoint is not the one resolveQualifyEndpoint produces').toBe(
      EXPECTED_ENDPOINT,
    );
    expect(providerPosts[0].bodyCarriesMarker, 'the posted body does not carry the marker').toBe(true);

    expect(response, 'no provider response was observed').not.toBeNull();
    expect(response?.ok(), `the provider answered ${String(response?.status())}`).toBe(true);

    /*
     * The FS-1 success row. A BROWSER-OBSERVABLE claim only: the page saw the provider accept the
     * request. It says nothing about whether mail arrived, or whether the endpoint is activated.
     */
    await expect(confirmation, 'the confirmation heading did not render').toBeVisible();
    await expect(confirmation, 'the confirmation heading did not receive focus').toBeFocused();
    expect(rendered.submissionRegionTexts, 'the submission status region text').toEqual([STATUS_SUCCEEDED]);

    expect(
      ingestionRequests,
      `the submission reached the analytics sink: ${ingestionRequests.join(', ')}`,
    ).toEqual([]);
  });
});
