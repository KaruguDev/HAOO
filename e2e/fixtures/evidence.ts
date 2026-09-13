import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { SurfaceId } from './surfaces';

/**
 * The measured-value recorder. One file per evidence name, under `evidence/`.
 *
 * `evidence/` is committed — the measured values there are this phase's product — which is why
 * the writer, not the reviewer, enforces the discipline that keeps them worth committing.
 *
 * **The recorder REFUSES a record with no measured value, and refuses the strings `pass`,
 * `passed` and `ok`.** A pass mark is not a measurement: it records the author's conclusion
 * instead of what the instrument read, and it cannot be re-examined later by anyone who
 * doubts the conclusion. The project precedent is
 * `.planning/phases/04.2-.../04.2-VERIFICATION.md` § Human Verification Outcome, which
 * recorded four ZEROS alongside six non-zero counts. A "pass" would have collapsed those ten
 * facts into one opinion; the zeros are what distinguish what happened from what did not.
 *
 * Refusing at the writer rather than in review is the point. Review vigilance decays one spec
 * at a time and nobody notices the day it stops; a throw does not.
 */

/** The strings that look like evidence and are not. Compared case-insensitively, trimmed. */
const PASS_MARKS = ['pass', 'passed', 'ok', 'fail', 'failed', 'true', 'yes'] as const;

const EVIDENCE_DIR = resolve(import.meta.dirname, '../../evidence');

export interface EvidenceViewport {
  readonly width: number;
  readonly height: number;
}

/** What a caller supplies. The timestamp is stamped by the recorder, not by the caller. */
export interface EvidenceInput {
  readonly surface: SurfaceId;
  /** The viewport the measurement was taken at, or `null` where the measurement has none. */
  readonly viewport?: EvidenceViewport | null;
  /**
   * The measured value or values. Either a scalar reading or, more usually, a record of named
   * readings. Every value in it is checked: a record whose values are all pass marks is
   * refused exactly as a bare `'passed'` is.
   */
  readonly measured: unknown;
  /** Free-form context: rule ids, tag lists, engine versions, URLs, node targets. */
  readonly detail?: Record<string, unknown>;
}

export interface EvidenceRecord extends EvidenceInput {
  /** ISO-8601, UTC, stamped at write time. */
  readonly recordedAt: string;
}

/** Where a named evidence file lives. */
export function evidencePath(name: string): string {
  return resolve(EVIDENCE_DIR, `${name}.json`);
}

function isPassMark(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    PASS_MARKS.includes(value.trim().toLowerCase() as (typeof PASS_MARKS)[number])
  );
}

/**
 * Reject anything that is not a measurement.
 *
 * A number is a measurement, including `0` and including `NaN`-free negatives. `false` is a
 * measurement — `webdriver: false` says something. An empty array is a measurement: "no
 * escapees" is the most useful reading the overflow sweep produces. `null`, `undefined`, an
 * empty record and a pass-mark string are not.
 */
function assertMeasured(name: string, measured: unknown): void {
  if (measured === null || measured === undefined) {
    throw new Error(
      `evidence '${name}': refused a record whose measured value is ${String(measured)}. ` +
        'A record with no measured value is not evidence.',
    );
  }

  if (isPassMark(measured)) {
    throw new Error(
      `evidence '${name}': refused the measured value '${String(measured)}'. A pass mark is a ` +
        'conclusion, not a measurement — record what the instrument read.',
    );
  }

  if (typeof measured === 'object' && !Array.isArray(measured)) {
    const entries = Object.entries(measured as Record<string, unknown>);
    if (entries.length === 0) {
      throw new Error(
        `evidence '${name}': refused a record whose measured object is empty. An empty reading ` +
          'is an unasked question, not a measurement.',
      );
    }
    for (const [key, value] of entries) {
      if (value === null || value === undefined) {
        throw new Error(
          `evidence '${name}': refused measured.${key} — its value is ${String(value)}. ` +
            'Record the reading, or leave the key out and say why in `detail`.',
        );
      }
      if (isPassMark(value)) {
        throw new Error(
          `evidence '${name}': refused measured.${key} = '${String(value)}'. A pass mark is a ` +
            'conclusion, not a measurement — record what the instrument read.',
        );
      }
    }
  }
}

/** Whether a filesystem error says the file is ABSENT, as opposed to present but unreadable. */
export function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

/**
 * Replace the file at `path` with `body` so that any reader sees either the whole old file or the
 * whole new one, never a partial one.
 *
 * `writeFileSync` truncates the target before it writes. A worker killed mid-write (a timeout, a
 * Ctrl-C) would leave a truncated committed file, and a second process reading at that moment
 * would parse an empty or partial array. So the body goes to a uniquely named temporary sibling
 * first — the same directory, therefore the same filesystem — and is then renamed over the target,
 * which is atomic on POSIX. A failed write removes its own temporary file rather than leaving it in
 * `evidence/` (and `.gitignore` ignores `evidence/*.tmp` in case a kill leaves one anyway).
 *
 * This makes each write whole. It does not serialise two writers: two processes that both read N
 * records and both write N+1 still lose one append. Run one project at a time against a shared
 * evidence file.
 */
export function writeFileAtomically(path: string, body: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.${randomBytes(4).toString('hex')}.tmp`;
  try {
    writeFileSync(temporary, body, { encoding: 'utf8', flag: 'wx' });
    renameSync(temporary, path);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

/** Every record already written under this evidence name, or `[]` when the file is absent. */
export function readEvidence(name: string): readonly EvidenceRecord[] {
  let raw: string;
  try {
    raw = readFileSync(evidencePath(name), 'utf8');
  } catch (error) {
    // Only an ABSENT file is an empty record set. Any other failure — a permission error, a
    // directory in the file's place, descriptor exhaustion — says nothing about what the file
    // holds, and treating it as empty would let the next append replace every earlier measurement.
    if (isMissingFileError(error)) return [];
    throw error;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(
      `evidence '${name}': the existing file is not an array of records. Refusing to append to ` +
        'it rather than silently rewriting a measurement somebody else made.',
    );
  }
  return parsed as EvidenceRecord[];
}

/**
 * Append one measured record under `evidence/<name>.json`.
 *
 * Appends rather than overwrites: a run that replaced the previous run's file would destroy
 * the only copy of a measurement taken under conditions that no longer exist.
 */
export function recordEvidence(name: string, input: EvidenceInput): EvidenceRecord {
  assertMeasured(name, input.measured);

  const record: EvidenceRecord = {
    recordedAt: new Date().toISOString(),
    surface: input.surface,
    viewport: input.viewport ?? null,
    measured: input.measured,
    detail: input.detail ?? {},
  };

  const records = [...readEvidence(name), record];
  writeFileAtomically(evidencePath(name), `${JSON.stringify(records, null, 2)}\n`);
  return record;
}
