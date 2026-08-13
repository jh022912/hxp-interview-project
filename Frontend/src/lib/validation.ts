import { z } from "zod";
import type { Cohort } from "../data/trips";
import { ADULT_AGE, MAX_ELIGIBLE_AGE, MIN_ELIGIBLE_AGE, ageOnDate, parseYMD } from "./eligibility";

/**
 * Client-side mirror of Backend/lib/validate.ts's signupSchema. Kept in
 * lockstep with the server rules on purpose — client-side validation here
 * is a UX nicety (instant feedback), never the security boundary. The
 * server re-validates and re-derives eligibility independently from its
 * own cohort/departure-date lookup, never trusting anything computed here.
 */
const NAME_PATTERN = /^[\p{L}\p{M} '.-]{2,100}$/u;
const PHONE_PATTERN = /^[0-9+\-() .]{7,20}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const signupFormObjectSchema = z.object({
  cohortId: z.string().min(1, "Choose a departure date."),
  fullName: z
    .string()
    .trim()
    .regex(NAME_PATTERN, "Enter your full name (letters only)."),
  dateOfBirth: z.string().regex(ISO_DATE_PATTERN, "Enter your date of birth."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().regex(PHONE_PATTERN, "Enter a valid phone number."),
  // For a minor, these fields are relabeled "Parent/guardian name/phone" in
  // the UI and serve double duty — see SignUpForm.tsx and the README's
  // Round 2 notes for why (avoids collecting two unrelated adults' worth
  // of contact info, and makes explicit that a minor's emergency contact
  // must be their parent/guardian, not just labeled as if it might be).
  emergencyContactName: z
    .string()
    .trim()
    .regex(NAME_PATTERN, "Enter your emergency contact's name."),
  emergencyContactPhone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Enter a valid phone number."),
  guardianEmail: z.string().trim().max(254).optional().or(z.literal("")),
  guardianConfirmed: z.boolean().optional(),
  dietaryRestrictions: z.string().trim().max(300, "Keep this under 300 characters.").optional(),
  reason: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(1000, "Keep this under 1000 characters."),
  // Honeypot is intentionally NOT part of this schema — it's a hidden field
  // read directly off the form and appended to the payload at submit time,
  // never shown to or validated against the user.
});

export type SignupFormValues = z.infer<typeof signupFormObjectSchema>;

/** Result of checking a birthdate against a specific cohort's departure date. */
export type EligibilityResult =
  | { status: "eligible"; isMinor: boolean }
  | { status: "ineligible"; direction: "tooYoung" | "tooOld"; eligibleCohorts: Cohort[] }
  | { status: "invalid" };

export function checkEligibility(dateOfBirth: string, cohorts: Cohort[], cohortId: string): EligibilityResult {
  const dob = parseYMD(dateOfBirth);
  if (!dob) return { status: "invalid" };

  const selected = cohorts.find((c) => c.id === cohortId);
  const selectedDeparture = selected ? parseYMD(selected.departureDate) : null;
  if (!selectedDeparture) return { status: "invalid" };

  const age = ageOnDate(dob, selectedDeparture);
  if (age >= MIN_ELIGIBLE_AGE && age <= MAX_ELIGIBLE_AGE) {
    return { status: "eligible", isMinor: age < ADULT_AGE };
  }

  // Same birthdate might still qualify for a different departure date —
  // worth telling the user rather than leaving them at a dead end.
  const eligibleCohorts = cohorts.filter((c) => {
    const departure = parseYMD(c.departureDate);
    if (!departure) return false;
    const ageThere = ageOnDate(dob, departure);
    return ageThere >= MIN_ELIGIBLE_AGE && ageThere <= MAX_ELIGIBLE_AGE;
  });

  return { status: "ineligible", direction: age < MIN_ELIGIBLE_AGE ? "tooYoung" : "tooOld", eligibleCohorts };
}

export function ineligibleMessage(result: Extract<EligibilityResult, { status: "ineligible" }>): string {
  const suggestion =
    result.eligibleCohorts.length > 0
      ? ` Based on this date of birth, you'd qualify for: ${result.eligibleCohorts.map((c) => c.dateRange).join(", ")}.`
      : "";

  if (result.direction === "tooYoung") {
    return (
      `For this trip, all Builders need to be between ${MIN_ELIGIBLE_AGE} and ${MAX_ELIGIBLE_AGE} ` +
      `years old on departure. Please look into our domestic trips, or check back next year — ` +
      `we'd love to have you when you're a bit older!${suggestion}`
    );
  }

  return (
    `For this trip, all Builders need to be between ${MIN_ELIGIBLE_AGE} and ${MAX_ELIGIBLE_AGE} ` +
    `years old on departure. If you're interested in returning as a Trip Leader or exploring other ` +
    `ways to get involved, reach out to our team — we'd love to have you back.${suggestion}`
  );
}

/**
 * Cohort-aware schema factory — eligibility depends on which departure date
 * is selected, so the schema needs the trip's cohort list to look up the
 * right departure date and run the same age math the server will.
 */
export function createSignupFormSchema(cohorts: Cohort[]) {
  return signupFormObjectSchema.superRefine((data, ctx) => {
    const result = checkEligibility(data.dateOfBirth, cohorts, data.cohortId);

    if (result.status === "invalid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Enter a valid date of birth.",
      });
      return;
    }

    if (result.status === "ineligible") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: ineligibleMessage(result),
      });
      return;
    }

    if (result.isMinor) {
      const guardianEmail = data.guardianEmail?.trim() ?? "";

      if (!guardianEmail || !z.string().email().safeParse(guardianEmail).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianEmail"],
          message: "A valid parent/guardian email is required for Builders under 18.",
        });
      }

      if (!data.guardianConfirmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianConfirmed"],
          message: "Please confirm the contact above is your parent or legal guardian.",
        });
      }
    }
  });
}
