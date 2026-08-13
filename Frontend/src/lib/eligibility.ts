/**
 * Pure integer Y/M/D date math — deliberately never touches Date-object
 * timezone parsing for the actual age comparison, so a browser in Mountain
 * Time and a server in UTC can never disagree about whether someone is 16
 * yet. `new Date(...)` is only used in parseYMD to validate that a calendar
 * date is real (rejects e.g. Feb 30), constructed from explicit local
 * components so it carries no timezone ambiguity either.
 *
 * Mirrored in Backend/lib/eligibility.ts. Duplicated rather than shared
 * across the two independent projects — see README "what was cut."
 */
export type YMD = { y: number; m: number; d: number };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseYMD(dateStr: string): YMD | null {
  const match = DATE_PATTERN.exec(dateStr);
  if (!match) return null;

  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);

  const roundTrip = new Date(y, m - 1, d);
  if (roundTrip.getFullYear() !== y || roundTrip.getMonth() !== m - 1 || roundTrip.getDate() !== d) {
    return null;
  }

  return { y, m, d };
}

/** Age in whole years as of `onDate`, given a birthdate. */
export function ageOnDate(dob: YMD, onDate: YMD): number {
  let age = onDate.y - dob.y;
  if (onDate.m < dob.m || (onDate.m === dob.m && onDate.d < dob.d)) {
    age -= 1;
  }
  return age;
}

export const MIN_ELIGIBLE_AGE = 16;
export const MAX_ELIGIBLE_AGE = 19;
export const ADULT_AGE = 18;
