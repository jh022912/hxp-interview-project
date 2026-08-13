import type { Trip } from "../data/trips";
import styles from "./Itinerary.module.css";

type ItineraryProps = {
  trip: Trip;
};

export function Itinerary({ trip }: ItineraryProps) {
  return (
    <section className={`section ${styles.section}`} id="itinerary">
      <div className="container">
        <p className="eyebrow">The Itinerary</p>
        <h2 className={styles.heading}>A rough shape of the trip</h2>
        <ol className={styles.timeline}>
          {trip.itinerary.map((phase) => (
            <li className={styles.phase} key={phase.label}>
              <span className={styles.label}>{phase.label}</span>
              <p className={styles.description}>{phase.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
