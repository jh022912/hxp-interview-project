import { z } from "zod";
import validator from "validator";
import { ADULT_AGE, MAX_ELIGIBLE_AGE, MIN_ELIGIBLE_AGE, ageOnDate, parseYMD } from "./eligibility.js";
import { getCohortDepartureDate } from "./cohorts.js";

// Structured fields are protected by allowlisting their character set —
// none of these patterns can contain `<`, `>`, `&`, or quotes, so they can
// never carry an HTML/script payload regardless of what a client sends.
const NAME_PATTERN = /^[\p{L}\p{M} '.-]{2,100}$/u;
const PHONE_PATTERN = /^[0-9+\-() .]{7,20}$/;
const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const baseSchema = z.object({
  tripId: z.string().regex(SLUG_PATTERN, "Invalid trip."),
  cohortId: z.string().regex(SLUG_PATTERN, "Select a departure date."),
  fullName: z.string().regex(NAME_PATTERN, "Enter a valid full name."),
  dateOfBirth: z.string().regex(ISO_DATE_PATTERN, "Enter a valid date of birth."),
  email: z.string().email("Enter a valid email address.").max(254),
  phone: z.string().regex(PHONE_PATTERN, "Enter a valid phone number."),
  emergencyContactName: z
    .string()
    .regex(NAME_PATTERN, "Enter a valid emergency contact name."),
  emergencyContactPhone: z
    .string()
    .regex(PHONE_PATTERN, "Enter a valid emergency contact phone number."),
  // Only required for minors (enforced below in superRefine, since that's
  // the only place we know the applicant's age-on-departure). Loosely typed
  // here on purpose — sanitized/validated properly once we know it's needed.
  guardianName: z.string().max(100).optional().or(z.literal("")),
  guardianEmail: z.string().max(254).optional().or(z.literal("")),
  dietaryRestrictions: z
    .string()
    .max(300, "Keep this under 300 characters.")
    .optional()
    .or(z.literal("")),
  reason: z
    .string()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(1000, "Keep this under 1000 characters."),
  // Honeypot — real users never fill this in. Validated loosely on purpose;
  // Backend/api/signup.ts checks it before this schema even runs.
  website: z.string().max(200).optional().or(z.literal("")),
});

export const signupSchema = baseSchema.superRefine((data, ctx) => {
  const dob = parseYMD(data.dateOfBirth);
  if (!dob) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateOfBirth"],
      message: "Enter a valid date of birth.",
    });
    return;
  }

  const today = new Date();
  const todayYmd = { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };
  if (ageOnDate(dob, todayYmd) < 0 || (dob.y === todayYmd.y && dob.m === todayYmd.m && dob.d > todayYmd.d)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateOfBirth"],
      message: "Date of birth can't be in the future.",
    });
    return;
  }

  // Authoritative departure date is looked up server-side by cohortId —
  // never trusted from the client — so a forged request can't claim a
  // different (more favorable) departure date than the one it selected.
  const departureDateStr = getCohortDepartureDate(data.tripId, data.cohortId);
  const departureDate = departureDateStr ? parseYMD(departureDateStr) : null;
  if (!departureDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cohortId"],
      message: "Select a valid departure date for this trip.",
    });
    return;
  }

  const ageAtDeparture = ageOnDate(dob, departureDate);

  if (ageAtDeparture < MIN_ELIGIBLE_AGE || ageAtDeparture > MAX_ELIGIBLE_AGE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateOfBirth"],
      message: `Builders must be ${MIN_ELIGIBLE_AGE}–${MAX_ELIGIBLE_AGE} years old on the trip's departure date.`,
    });
    return;
  }

  if (ageAtDeparture < ADULT_AGE) {
    const guardianName = data.guardianName?.trim() ?? "";
    const guardianEmail = data.guardianEmail?.trim() ?? "";

    if (!guardianName || !NAME_PATTERN.test(guardianName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guardianName"],
        message: "Guardian name is required for Builders under 18.",
      });
    }

    if (!guardianEmail || !z.string().email().safeParse(guardianEmail).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guardianEmail"],
        message: "A valid guardian email is required for Builders under 18.",
      });
    }
  }
});

export type SignupInput = z.infer<typeof baseSchema>;

export type SanitizedSignup = {
  tripId: string;
  cohortId: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  guardianName: string | null;
  guardianEmail: string | null;
  dietaryRestrictions: string | null;
  reason: string;
};

/**
 * Free-text fields (reason, dietary restrictions, guardian name) can't be
 * allowlisted the way names/phones are... actually guardian name IS
 * allowlisted (NAME_PATTERN, checked above) — only reason/dietary need
 * HTML-escaping. Strip control characters and HTML-encode before storage.
 * Defense in depth: the data is inert even if a future feature renders it
 * without re-escaping.
 */
function sanitizeFreeText(input: string): string {
  const noControlChars = validator.stripLow(input.trim(), true /* keep \n, \t */);
  return validator.escape(noControlChars);
}

export function sanitizeSignup(input: SignupInput): SanitizedSignup {
  const dob = parseYMD(input.dateOfBirth)!;
  const departureDateStr = getCohortDepartureDate(input.tripId, input.cohortId)!;
  const departureDate = parseYMD(departureDateStr)!;
  const isMinor = ageOnDate(dob, departureDate) < ADULT_AGE;

  return {
    tripId: input.tripId,
    cohortId: input.cohortId,
    fullName: input.fullName.trim(),
    dateOfBirth: input.dateOfBirth,
    email: validator.normalizeEmail(input.email) || input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    emergencyContactName: input.emergencyContactName.trim(),
    emergencyContactPhone: input.emergencyContactPhone.trim(),
    guardianName: isMinor ? input.guardianName!.trim() : null,
    guardianEmail: isMinor
      ? validator.normalizeEmail(input.guardianEmail!.trim()) || input.guardianEmail!.trim().toLowerCase()
      : null,
    dietaryRestrictions: input.dietaryRestrictions
      ? sanitizeFreeText(input.dietaryRestrictions)
      : null,
    reason: sanitizeFreeText(input.reason),
  };
}
