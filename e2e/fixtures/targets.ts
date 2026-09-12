import { expect, type Locator, type Page } from '@playwright/test';

import { OVERFLOW_TOLERANCE_PX } from './overflow';
import { MIN_PRIMARY_HIT_TARGET_PX, type PrimaryAction } from './primary-actions';
import { assertNonEmptySubjects } from './surfaces';

/**
 * The VC-2 primary-action measurement, shared by the viewport and zoom/motion specs.
 *
 * Moved here verbatim from `e2e/viewport.e2e.ts` (05-08) by 05-13, because Playwright refuses a
 * spec that imports another spec ("test file ... should not import test file ..."). The zoom and
 * reduced-motion measurements must re-run exactly these conditions rather than a restatement of
 * them, and a copy would be two definitions of "reachable primary action" free to drift apart.
 * Nothing in the bodies below changed in the move; only `export` was added.
 */

/* ------------------------------------------------------------------------------------ *
 * Target geometry — the five VC-2 conditions for one element.
 * ------------------------------------------------------------------------------------ */

export interface TargetReading {
  /** Whether the element has any layout box at all at this width. */
  readonly rendered: boolean;
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly innerWidth: number;
  /**
   * The vertical extent, recorded so a target that cannot be brought into view is measurable.
   * It is NOT asserted against `innerHeight`: D-OQ-2 settles that a primary action need only be
   * reachable by scrolling, so an above-the-fold check here would fail correct screens.
   */
  readonly top: number;
  readonly bottom: number;
  readonly innerHeight: number;
  readonly visibility: string;
  /** The product of the element's and every ancestor's computed opacity. */
  readonly effectiveOpacity: number;
  /** True when some clipping ancestor's box does not intersect the element's box at all. */
  readonly clippedOut: boolean;
  readonly disabled: boolean;
  /** Whether the element sits inside a `<nav>` — the only breakpoint-conditional container. */
  readonly insideNav: boolean;
  /** The raw `href` attribute, or `''` for an element without one. */
  readonly href: string;
  readonly tabIndex: number;
}

export async function readTarget(locator: Locator): Promise<TargetReading> {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rendered = element.getClientRects().length > 0 && style.display !== 'none';
    const rect = element.getBoundingClientRect();

    let effectiveOpacity = 1;
    let clippedOut = false;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const nodeStyle = window.getComputedStyle(node);
      effectiveOpacity *= Number.parseFloat(nodeStyle.opacity);
      if (node !== element && (nodeStyle.overflowX !== 'visible' || nodeStyle.overflowY !== 'visible')) {
        const clip = node.getBoundingClientRect();
        const overlapWidth = Math.min(rect.right, clip.right) - Math.max(rect.left, clip.left);
        const overlapHeight = Math.min(rect.bottom, clip.bottom) - Math.max(rect.top, clip.top);
        if (overlapWidth <= 0 || overlapHeight <= 0) clippedOut = true;
      }
    }

    const round = (value: number): number => Math.round(value * 100) / 100;
    return {
      rendered,
      width: round(rect.width),
      height: round(rect.height),
      left: round(rect.left),
      right: round(rect.right),
      innerWidth: window.innerWidth,
      top: round(rect.top),
      bottom: round(rect.bottom),
      innerHeight: window.innerHeight,
      visibility: style.visibility,
      effectiveOpacity: round(effectiveOpacity),
      clippedOut,
      disabled:
        (element as HTMLButtonElement).disabled === true ||
        element.getAttribute('aria-disabled') === 'true',
      insideNav: element.closest('nav') !== null,
      href: element.getAttribute('href') ?? '',
      tabIndex: (element as HTMLElement).tabIndex,
    };
  });
}

/**
 * Every way a rendered target can fail the VC-2 conditions against a given floor, as words.
 * An empty list is the reading that the target is present, visible, unclipped, inside the
 * viewport's horizontal extent, at least `floor` by `floor`, and enabled.
 */
export function targetDefects(reading: TargetReading, floor: number): string[] {
  const defects: string[] = [];
  if (!reading.rendered) defects.push('has no layout box');
  if (reading.width === 0 || reading.height === 0) defects.push('has a zero-area box');
  if (reading.visibility === 'hidden') defects.push('computes visibility: hidden');
  if (reading.effectiveOpacity === 0) defects.push('computes an effective opacity of 0');
  if (reading.clippedOut) defects.push('is clipped entirely out of its layout box by an ancestor');
  if (reading.left < -OVERFLOW_TOLERANCE_PX) {
    defects.push(`left edge ${reading.left} is outside the viewport`);
  }
  if (reading.right > reading.innerWidth + OVERFLOW_TOLERANCE_PX) {
    defects.push(`right edge ${reading.right} exceeds the ${reading.innerWidth}px viewport`);
  }
  // Compared raw, no epsilon — the MIN_FOCUS_CONTRAST discipline.
  if (reading.width < floor || reading.height < floor) {
    defects.push(`hit target ${reading.width}x${reading.height} is below ${floor}x${floor}`);
  }
  if (reading.disabled) defects.push('is disabled');
  return defects;
}

/**
 * Whether the element actually receives a pointer event at its action point. Playwright's
 * trial click runs every actionability check — attached, visible, stable, enabled, and NOT
 * obscured by another element such as a fixed header — without performing the click, so a
 * link is not followed and nothing is submitted.
 */
export async function receivesPointer(locator: Locator): Promise<string> {
  try {
    await locator.click({ trial: true, timeout: 5_000 });
    return 'receives-pointer';
  } catch (error) {
    return `not-actionable: ${(error as Error).message.split('\n')[0]}`;
  }
}

/* ------------------------------------------------------------------------------------ *
 * Disclosure openers — the collapsed-disclosure rule.
 * ------------------------------------------------------------------------------------ */

export interface OpenerReading {
  readonly name: string;
  readonly box: TargetReading;
  readonly pointer: string;
  readonly defects: readonly string[];
}

/**
 * Measure a disclosure's opening control against the PRIMARY floor, before it is used.
 *
 * An action behind a collapsed disclosure counts as reachable only if the control that opens it
 * is itself keyboard-operable, named and at least 44 by 44 (UI-SPEC § VC-2). Keyboard
 * operability is proven by the caller activating it with Enter, never by clicking.
 */
export async function measureOpener(opener: Locator): Promise<OpenerReading> {
  await opener.scrollIntoViewIfNeeded();
  const name = await opener.evaluate(
    (element) => (element.getAttribute('aria-label') ?? (element as HTMLElement).innerText).trim(),
  );
  await expect.soft(opener, 'a disclosure opener must carry its accessible name').toHaveAccessibleName(
    name,
  );

  const box = await readTarget(opener);
  const defects = targetDefects(box, MIN_PRIMARY_HIT_TARGET_PX);
  if (name.length === 0) defects.push('has an empty accessible name');
  if (box.tabIndex < 0) defects.push(`is not a sequential tab stop (tabIndex ${box.tabIndex})`);
  const pointer = await receivesPointer(opener);
  if (pointer !== 'receives-pointer') defects.push(pointer);

  return { name, box, pointer, defects };
}

/** Operate a control from the keyboard: focus it, then press Enter. */
export async function pressEnterOn(page: Page, control: Locator): Promise<void> {
  await control.focus();
  await page.keyboard.press('Enter');
}

/* ------------------------------------------------------------------------------------ *
 * Primary actions.
 * ------------------------------------------------------------------------------------ */

/**
 * The role an action is located by. P3 is the qualification submit control (`<button>`); every
 * other action in the closed list is an anchor. Stated per id rather than inferred, so a list
 * entry that changes role fails to locate instead of being silently re-read as something else.
 */
export function roleOf(action: PrimaryAction): 'button' | 'link' {
  return action.id === 'P3' ? 'button' : 'link';
}

export function locateAction(page: Page, action: PrimaryAction): Locator {
  // `includeHidden` so an instance hidden at this width (the desktop nav below `md`, the
  // mobile menu before it is opened) is ENUMERATED and classified, never silently skipped.
  return page.getByRole(roleOf(action), {
    name: action.accessibleName,
    exact: true,
    includeHidden: true,
  });
}

export interface InstanceReading {
  readonly index: number;
  /** How the instance was reached: already on screen, or through a disclosure. */
  readonly reachedVia: 'rendered' | 'disclosure' | 'not-rendered';
  readonly box: TargetReading;
  readonly pointer: string;
  readonly defects: readonly string[];
}

export interface ActionReading {
  readonly id: string;
  readonly accessibleName: string;
  readonly declaredDestinations: readonly string[];
  readonly declaredInstances: number;
  /** Elements carrying this exact accessible name, hidden or not. */
  readonly instancesFound: number;
  /** Anchors whose raw `href` equals one of the declared destinations — a census, not an assertion. */
  readonly anchorsToDestination: number;
  readonly hrefs: readonly string[];
  readonly reachableInstances: number;
  readonly instances: readonly InstanceReading[];
  readonly opener: OpenerReading | null;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly defects: readonly string[];
}

/** Read one rendered instance against the primary floor. */
export async function readInstance(
  locator: Locator,
  index: number,
  action: PrimaryAction,
  reachedVia: 'rendered' | 'disclosure',
): Promise<InstanceReading> {
  // D-OQ-2: scrolling to an action before measuring it is correct and expected.
  await locator.scrollIntoViewIfNeeded();
  await expect
    .soft(locator, `${action.id} instance ${index} is not in the accessibility tree by its name`)
    .toHaveAccessibleName(action.accessibleName);

  const box = await readTarget(locator);
  const defects = targetDefects(box, MIN_PRIMARY_HIT_TARGET_PX);
  const pointer = await receivesPointer(locator);
  if (pointer !== 'receives-pointer') defects.push(pointer);
  return { index, reachedVia, box, pointer, defects };
}

/**
 * Measure one primary action at the current width.
 *
 * Every instance is located by its shipped accessible name. A rendered instance must satisfy all
 * five VC-2 conditions against the 44 px floor. An instance with no layout box at this width is
 * acceptable ONLY inside a `<nav>` (the breakpoint-conditional navigation both sites ship), and
 * only if the action still has a reachable instance — directly, or through a disclosure whose
 * opener passes `measureOpener`. Any other unrendered instance is a hidden primary action.
 *
 * Same accessible name must mean same destination. Names are NOT asserted unique: P4–P8 render
 * three times with byte-identical names by design.
 */
export async function measureAction(page: Page, action: PrimaryAction): Promise<ActionReading> {
  const located = locateAction(page, action);
  const count = await located.count();
  const instanceIndexes = assertNonEmptySubjects(
    Array.from({ length: count }, (_, index) => index),
    `${action.id} (${action.accessibleName}) located by its shipped accessible name`,
  );

  const hrefs: string[] = [];
  const instances: InstanceReading[] = [];
  const pending: number[] = [];
  const defects: string[] = [];

  for (const index of instanceIndexes) {
    const instance = located.nth(index);
    hrefs.push((await instance.getAttribute('href')) ?? '');
    const probe = await readTarget(instance);
    if (probe.rendered) {
      instances.push(await readInstance(instance, index, action, 'rendered'));
    } else {
      pending.push(index);
    }
  }

  // Unrendered instances: sanctioned only inside a navigation that has a disclosure path.
  let opener: OpenerReading | null = null;
  for (const index of pending) {
    const instance = located.nth(index);
    const probe = await readTarget(instance);
    if (!probe.insideNav) {
      instances.push({ index, reachedVia: 'not-rendered', box: probe, pointer: 'not-rendered', defects: ['is hidden outside any navigation — a hidden primary action'] });
      continue;
    }

    const controlledId = await instance.evaluate((element) => element.closest('nav')?.id ?? '');
    const toggle = controlledId === '' ? null : page.locator(`button[aria-controls="${controlledId}"]`);
    if (toggle === null || (await toggle.count()) !== 1 || !(await readTarget(toggle)).rendered) {
      // A desktop-only instance below `md`, with no opener of its own. Acceptable only if the
      // action is reachable some other way, which is checked once every instance is classified.
      instances.push({ index, reachedVia: 'not-rendered', box: probe, pointer: 'not-rendered', defects: [] });
      continue;
    }

    // The collapsed-disclosure rule: measure the opener, operate it by keyboard, then measure
    // the revealed instance — and close the disclosure again so it cannot obscure anything else.
    opener = await measureOpener(toggle);
    await pressEnterOn(page, toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    instances.push(await readInstance(instance, index, action, 'disclosure'));
    await pressEnterOn(page, toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  }

  const reachable = instances.filter(
    (instance) =>
      instance.reachedVia !== 'not-rendered' &&
      instance.defects.length === 0 &&
      (instance.reachedVia === 'rendered' || (opener !== null && opener.defects.length === 0)),
  );
  if (reachable.length === 0) defects.push('has no reachable instance at this width');
  for (const instance of instances) {
    for (const defect of instance.defects) defects.push(`instance ${instance.index} ${defect}`);
  }
  if (opener !== null) {
    for (const defect of opener.defects) defects.push(`the opener '${opener.name}' ${defect}`);
  }

  // Identical accessible name implies identical destination. Divergence is the defect.
  const distinctHrefs = [...new Set(hrefs)];
  if (distinctHrefs.length !== 1) {
    defects.push(`one accessible name resolves to ${distinctHrefs.length} destinations: ${distinctHrefs.join(', ')}`);
  }
  if (roleOf(action) === 'link' && !action.destinations.includes(distinctHrefs[0] ?? '')) {
    defects.push(`resolves to '${distinctHrefs[0] ?? ''}', not a declared destination (${action.destinations.join(', ')})`);
  }

  const measured = instances.filter((instance) => instance.reachedVia !== 'not-rendered');
  const anchorsToDestination =
    roleOf(action) === 'link'
      ? await page.locator('a[href]').evaluateAll(
          (anchors, destinations) =>
            anchors.filter((anchor) => destinations.includes(anchor.getAttribute('href') ?? '')).length,
          [...action.destinations],
        )
      : 0;

  return {
    id: action.id,
    accessibleName: action.accessibleName,
    declaredDestinations: action.destinations,
    declaredInstances: action.instances,
    instancesFound: count,
    anchorsToDestination,
    hrefs,
    reachableInstances: reachable.length,
    instances,
    opener,
    minWidth: measured.length === 0 ? 0 : Math.min(...measured.map((instance) => instance.box.width)),
    minHeight: measured.length === 0 ? 0 : Math.min(...measured.map((instance) => instance.box.height)),
    defects,
  };
}
