import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkEligibility, createSignupFormSchema, type SignupFormValues } from "../lib/validation";
import { submitSignup } from "../lib/api";
import type { SignupPayload } from "../lib/types";
import type { Trip } from "../data/trips";
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
  trip: Trip;
};

export function SignUpForm({ trip }: SignUpFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const schema = useMemo(() => createSignupFormSchema(trip.cohorts), [trip.cohorts]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
  });

  const [watchedDob, watchedCohortId] = watch(["dateOfBirth", "cohortId"]);
  const eligibility = useMemo(
    () => checkEligibility(watchedDob ?? "", trip.cohorts, watchedCohortId ?? ""),
    [watchedDob, watchedCohortId, trip.cohorts],
  );
  const isMinor = eligibility.status === "eligible" && eligibility.isMinor;

  if (submitted) {
    return <Confirmation tripName={trip.name} />;
  }

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);

    const payload: SignupPayload = {
      tripId: trip.slug,
      cohortId: values.cohortId,
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth,
      email: values.email,
      phone: values.phone,
      emergencyContactName: values.emergencyContactName,
      emergencyContactPhone: values.emergencyContactPhone,
      guardianName: values.guardianName ?? "",
      guardianEmail: values.guardianEmail ?? "",
      guardianConfirmed: values.guardianConfirmed ?? false,
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

        <form
          className={`card ${styles.form}`}
          onSubmit={(event) => {
            // Clear any previous API error on every submit attempt — including
            // ones that fail client-side validation and never reach onSubmit.
            setServerError(null);
            void handleSubmit(onSubmit)(event);
          }}
          noValidate
        >
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
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
                {...register("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p id="dateOfBirth-error" className={styles.error} role="alert">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="cohortId">Departure date</label>
              <select
                id="cohortId"
                defaultValue=""
                aria-invalid={!!errors.cohortId}
                aria-describedby={errors.cohortId ? "cohortId-error" : undefined}
                {...register("cohortId")}
              >
                <option value="" disabled>
                  Choose a departure date
                </option>
                {trip.cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id} disabled={cohort.status === "soldOut"}>
                    {cohort.dateRange}
                    {cohort.status === "waitlist" ? " (Waitlist)" : ""}
                    {cohort.status === "soldOut" ? " (Sold out)" : ""}
                  </option>
                ))}
              </select>
              {errors.cohortId && (
                <p id="cohortId-error" className={styles.error} role="alert">
                  {errors.cohortId.message}
                </p>
              )}
            </div>
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

          {isMinor && (
            <div className={styles.guardianSection}>
              <p className={styles.hint}>
                Builders under 18 need a parent or legal guardian's consent to join. Enter their
                name and email below — this can be the same as your emergency contact above, or
                someone else.
              </p>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="guardianName">Parent/guardian name</label>
                  <input
                    id="guardianName"
                    type="text"
                    aria-invalid={!!errors.guardianName}
                    aria-describedby={errors.guardianName ? "guardianName-error" : undefined}
                    {...register("guardianName")}
                  />
                  {errors.guardianName && (
                    <p id="guardianName-error" className={styles.error} role="alert">
                      {errors.guardianName.message}
                    </p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="guardianEmail">Parent/guardian email</label>
                  <input
                    id="guardianEmail"
                    type="email"
                    aria-invalid={!!errors.guardianEmail}
                    aria-describedby={errors.guardianEmail ? "guardianEmail-error" : undefined}
                    {...register("guardianEmail")}
                  />
                  {errors.guardianEmail && (
                    <p id="guardianEmail-error" className={styles.error} role="alert">
                      {errors.guardianEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.checkboxField}>
                <label htmlFor="guardianConfirmed">
                  <input
                    id="guardianConfirmed"
                    type="checkbox"
                    aria-invalid={!!errors.guardianConfirmed}
                    aria-describedby={
                      errors.guardianConfirmed ? "guardianConfirmed-error" : undefined
                    }
                    {...register("guardianConfirmed")}
                  />
                  I confirm this person is my parent or legal guardian and consents to my
                  participation in this trip.
                </label>
                {errors.guardianConfirmed && (
                  <p id="guardianConfirmed-error" className={styles.error} role="alert">
                    {errors.guardianConfirmed.message}
                  </p>
                )}
              </div>
            </div>
          )}

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

          <p className={styles.serverError} role="alert" aria-live="assertive" aria-atomic="true">
            {serverError}
          </p>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
            {isSubmitting ? "Submitting…" : "Submit Sign-Up"}
          </button>
        </form>
      </div>
    </section>
  );
}
