import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.wordmark}>
          HXP<span className={styles.dot}>.</span>
        </span>
        <p className={styles.note}>
          A fictional trip page built for a technical assignment — not affiliated with or
          endorsed by the real hxp.org.
        </p>
      </div>
    </footer>
  );
}
