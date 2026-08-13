import styles from "./Confirmation.module.css";

type ConfirmationProps = {
  tripName: string;
};

export function Confirmation({ tripName }: ConfirmationProps) {
  return (
    <section className="section" id="signup">
      <div className={`container ${styles.wrap}`}>
        <div className={`card ${styles.card}`}>
          <p className={styles.badge}>Signed Up</p>
          <h2 className={styles.heading}>You're on the list.</h2>
          <p className={styles.body}>
            Thanks for signing up for <strong>{tripName}</strong>. A member of the HXP team will
            reach out by email with next steps, including payment and your Builder checklist.
          </p>
        </div>
      </div>
    </section>
  );
}
