import { useEffect, useRef } from "react";
import styles from "./Confirmation.module.css";

type ConfirmationProps = {
  tripName: string;
};

export function Confirmation({ tripName }: ConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="section" id="signup">
      <div className={`container ${styles.wrap}`}>
        <div className={`card ${styles.card}`}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 48 48" width="56" height="56" focusable="false">
              <circle cx="24" cy="24" r="22" />
              <path d="M14 25.5 L21 32.5 L34 16.5" />
            </svg>
          </span>
          <p className={styles.badge}>Signed Up</p>
          <h2 ref={headingRef} tabIndex={-1} className={styles.heading}>
            You're on the list.
          </h2>
          <p className={styles.body}>
            Thanks for signing up for <strong>{tripName}</strong>. A member of the HXP team will
            reach out by email with next steps, including payment and your Builder checklist.
          </p>
        </div>
      </div>
    </section>
  );
}
