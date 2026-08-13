import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.wordmark}>
          HXP<span className={styles.dot}>.</span>
        </span>
        <a className={styles.cta} href="#signup">
          Sign Up
        </a>
      </div>
    </header>
  );
}
