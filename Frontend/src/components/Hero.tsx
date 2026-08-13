import type { Trip } from "../data/trips";
import styles from "./Hero.module.css";

type HeroProps = {
  trip: Trip;
};

export function Hero({ trip }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.kicker}>{trip.heroKicker}</p>
        <h1 className={styles.title}>{trip.name}</h1>
        <p className={`accent-script ${styles.tagline}`}>{trip.tagline}</p>

        <div className={styles.facts}>
          <span className={styles.fact}>{trip.region}</span>
          <span className={styles.fact}>{trip.durationDays} days</span>
          <span className={styles.fact}>${trip.priceUsd.toLocaleString()}</span>
          <span className={styles.fact}>Ages {trip.ageRange}</span>
        </div>

        <a className="btn btn-primary" href="#signup">
          Sign Up For This Trip
        </a>
      </div>
    </section>
  );
}
