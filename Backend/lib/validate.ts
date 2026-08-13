import { z } from "zod";
import validator from "validator";

// Structured fields are protected by allowlisting their character set —
// none of these patterns can contain `<`, `>`, `&`, or quotes, so they can
// never carry an HTML/script payload regardless of what a client sends.
const NAME_PATTERN = /^[\p{L}\p{M} '.-]{2,100}$/u;
const PHONE_PATTERN = /^[0-9+\-() .]{7,20}$/;
const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;

export const signupSchema = z.object({
  tripId: z.string().regex(SLUG_PATTERN, "Invalid trip."),
  fullName: z.string().regex(NAME_PATTERN, "Enter a valid full name."),
  email: z.string().email("Enter a valid email address.").max(254),
  phone: z.string().regex(PHONE_PATTERN, "Enter a valid phone number."),
  emergencyContactName: z
    .string()
    .regex(NAME_PATTERN, "Enter a valid emergency contact name."),
  emergencyContactPhone: z
    .string()
    .regex(PHONE_PATTERN, "Enter a valid emergency contact phone number."),
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

export type SignupInput = z.infer<typeof signupSchema>;

export type SanitizedSignup = {
  tripId: string;
  fullName: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dietaryRestrictions: string | null;
  reason: string;
};

/**
 * Free-text fields (reason, dietary restrictions) can't be allowlisted the
 * way names/phones are, so instead we strip control characters and
 * HTML-encode the rest before it ever reaches storage. This is defense in
 * depth: the data is inert even if a future feature renders it without
 * re-escaping.
 */
function sanitizeFreeText(input: string): string {
  const noControlChars = validator.stripLow(input.trim(), true /* keep \n, \t */);
  return validator.escape(noControlChars);
}

export function sanitizeSignup(input: SignupInput): SanitizedSignup {
  return {
    tripId: input.tripId,
    fullName: input.fullName.trim(),
    email: validator.normalizeEmail(input.email) || input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    emergencyContactName: input.emergencyContactName.trim(),
    emergencyContactPhone: input.emergencyContactPhone.trim(),
    dietaryRestrictions: input.dietaryRestrictions
      ? sanitizeFreeText(input.dietaryRestrictions)
      : null,
    reason: sanitizeFreeText(input.reason),
  };
}
