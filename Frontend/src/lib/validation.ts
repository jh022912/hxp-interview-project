import { z } from "zod";

/**
 * Client-side mirror of Backend/lib/validate.ts's signupSchema. Kept in
 * lockstep with the server rules on purpose — client-side validation here
 * is a UX nicety (instant feedback), never the security boundary. The
 * server re-validates and sanitizes everything independently.
 */
const NAME_PATTERN = /^[\p{L}\p{M} '.-]{2,100}$/u;
const PHONE_PATTERN = /^[0-9+\-() .]{7,20}$/;

export const signupFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .regex(NAME_PATTERN, "Enter your full name (letters only)."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().regex(PHONE_PATTERN, "Enter a valid phone number."),
  emergencyContactName: z
    .string()
    .trim()
    .regex(NAME_PATTERN, "Enter your emergency contact's name."),
  emergencyContactPhone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Enter a valid phone number."),
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

export type SignupFormValues = z.infer<typeof signupFormSchema>;
