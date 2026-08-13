import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupFormSchema, type SignupFormValues } from "../lib/validation";
import { submitSignup } from "../lib/api";
import type { SignupPayload } from "../lib/types";
import { Confirmation } from "./Confirmation";
import styles from "./SignUpForm.module.css";

/**
 * Baseline, functionally-complete implementation (validation, sanitization
 * contract, honeypot, loading/error states all wired up end-to-end). This
 * is the file earmarked to be reworked/polished in Cursor per the README's
 * AI Workflow section — visual polish and micro-interactions are the
 * intended follow-up, not the wiring itself.
 */
type SignUpFormProps = {
  tripId: string;
  tripName: string;
};

export function SignUpForm({ tripId, tripName }: SignUpFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
  });

  if (submitted) {
    return <Confirmation tripName={tripName} />;
  }

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);

    const payload: SignupPayload = {
      tripId,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      dietaryRestrictions: values.dietaryRestrictions ?? "",
      reason: values.reason,
      website: honeypot,
    };

    const result = await submitSignup(payload);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setServerError(result.error);
  };

  return (
    <section className="section" id="signup">
      <div className={`container ${styles.wrap}`}>
        <p className="eyebrow">Sign Up</p>
        <h2 className={styles.heading}>Tell us about you</h2>

        <form className={`card ${styles.form}`} onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Honeypot: visually hidden (not display:none) so real users never see or fill it */}
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="website">Leave this field blank</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p id="fullName-error" className={styles.error} role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className={styles.error} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                {...register("phone")}
              />
              {errors.phone && (
                <p id="phone-error" className={styles.error} role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="emergencyContactName">Emergency contact name</label>
              <input
                id="emergencyContactName"
                type="text"
                aria-invalid={!!errors.emergencyContactName}
                aria-describedby={
                  errors.emergencyContactName ? "emergencyContactName-error" : undefined
                }
                {...register("emergencyContactName")}
              />
              {errors.emergencyContactName && (
                <p id="emergencyContactName-error" className={styles.error} role="alert">
                  {errors.emergencyContactName.message}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="emergencyContactPhone">Emergency contact phone</label>
              <input
                id="emergencyContactPhone"
                type="tel"
                aria-invalid={!!errors.emergencyContactPhone}
                aria-describedby={
                  errors.emergencyContactPhone ? "emergencyContactPhone-error" : undefined
                }
                {...register("emergencyContactPhone")}
              />
              {errors.emergencyContactPhone && (
                <p id="emergencyContactPhone-error" className={styles.error} role="alert">
                  {errors.emergencyContactPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="dietaryRestrictions">Dietary restrictions (optional)</label>
            <input
              id="dietaryRestrictions"
              type="text"
              aria-invalid={!!errors.dietaryRestrictions}
              aria-describedby={
                errors.dietaryRestrictions ? "dietaryRestrictions-error" : undefined
              }
              {...register("dietaryRestrictions")}
            />
            {errors.dietaryRestrictions && (
              <p id="dietaryRestrictions-error" className={styles.error} role="alert">
                {errors.dietaryRestrictions.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="reason">Why do you want to come on this trip?</label>
            <textarea
              id="reason"
              rows={4}
              aria-invalid={!!errors.reason}
              aria-describedby={errors.reason ? "reason-error" : undefined}
              {...register("reason")}
            />
            {errors.reason && (
              <p id="reason-error" className={styles.error} role="alert">
                {errors.reason.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className={styles.serverError} role="alert">
              {serverError}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit Sign-Up"}
          </button>
        </form>
      </div>
    </section>
  );
}
