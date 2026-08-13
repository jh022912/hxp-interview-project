import type { Trip } from "../data/trips";
import styles from "./TripDetails.module.css";

type TripDetailsProps = {
  trip: Trip;
};

export function TripDetails({ trip }: TripDetailsProps) {
  return (
    <section className="section" id="details">
      <div className={`container ${styles.grid}`}>
        <div className={styles.main}>
          <p className="eyebrow">The Trip</p>
          <h2 className={styles.heading}>What you'll be doing</h2>
          {trip.description.map((paragraph) => (
            <p className={styles.paragraph} key={paragraph.slice(0, 24)}>
              {paragraph}
            </p>
          ))}

          <div className={`card ${styles.projectCard}`}>
            <p className="eyebrow">The Project</p>
            <h3 className={styles.projectTitle}>{trip.project.title}</h3>
            <p className={styles.paragraph}>{trip.project.description}</p>
          </div>

          <div className={styles.includedGrid}>
            <div>
              <h3 className={styles.includedHeading}>What's included</h3>
              <ul className={styles.list}>
                {trip.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={styles.includedHeading}>Not included</h3>
              <ul className={styles.list}>
                {trip.notIncluded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className={`card ${styles.sidebar}`}>
          <p className={styles.price}>${trip.priceUsd.toLocaleString()}</p>
          <p className={styles.priceNote}>per Builder, most items included</p>

          <dl className={styles.factList}>
            <div className={styles.factRow}>
              <dt>Region</dt>
              <dd>{trip.region}</dd>
            </div>
            <div className={styles.factRow}>
              <dt>Ages</dt>
              <dd>{trip.ageRange}</dd>
            </div>
            <div className={styles.factRow}>
              <dt>Departs from</dt>
              <dd>{trip.departureAirport}</dd>
            </div>
            <div className={styles.factRow}>
              <dt>Climate</dt>
              <dd>{trip.climate}</dd>
            </div>
            <div className={styles.factRow}>
              <dt>Visa</dt>
              <dd>{trip.visa}</dd>
            </div>
            <div className={styles.factRow}>
              <dt>Vaccines</dt>
              <dd>{trip.vaccines}</dd>
            </div>
          </dl>

          <h3 className={styles.datesHeading}>Dates available</h3>
          <ul className={styles.cohortList}>
            {trip.cohorts.map((cohort) => (
              <li className={styles.cohort} key={cohort.id}>
                <span>{cohort.dateRange}</span>
                <span className={styles.slots}>
                  {cohort.status === "open" ? `${cohort.slotsLeft} slots left` : cohort.status}
                </span>
              </li>
            ))}
          </ul>

          <a className={`btn btn-primary ${styles.sidebarCta}`} href="#signup">
            Sign Up Now
          </a>
        </aside>
      </div>
    </section>
  );
}
