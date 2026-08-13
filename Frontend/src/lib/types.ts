/**
 * Mirrors Backend/lib/validate.ts's SignupInput shape exactly. This is the
 * contract the SignUpForm component (built separately in Cursor) targets —
 * it should import SignupPayload and validationSchema from here rather than
 * inventing its own field list or rules.
 */
export type SignupPayload = {
  tripId: string;
  cohortId: string;
  fullName: string;
  /** ISO YYYY-MM-DD */
  dateOfBirth: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  /**
   * Required only when the applicant is a minor on the selected departure
   * date (16-17; 18-19 need none of this). Explicitly separate from
   * emergencyContactName/Phone above — this is the parent/guardian's own
   * name and email, not a relabeled reuse of another field, so "guardian
   * name + email" is collected as its own explicit thing.
   */
  guardianName: string;
  guardianEmail: string;
  guardianConfirmed: boolean;
  dietaryRestrictions: string;
  reason: string;
  /** Honeypot — must stay empty and hidden from real users. */
  website: string;
};

export type SignupSuccess = {
  ok: true;
};

export type SignupFailure = {
  ok: false;
  error: string;
  fieldErrors?: Partial<Record<keyof SignupPayload, string[]>>;
};

export type SignupResult = SignupSuccess | SignupFailure;
