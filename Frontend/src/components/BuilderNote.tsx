import type { Trip } from "../data/trips";
import styles from "./BuilderNote.module.css";

type BuilderNoteProps = {
  trip: Trip;
};

export function BuilderNote({ trip }: BuilderNoteProps) {
  return (
    <section className="section">
      <div className={`container ${styles.wrap}`}>
        <p className="eyebrow">From A Returned Builder</p>
        <p className={`accent-script ${styles.quote}`}>&ldquo;{trip.builderNote.quote}&rdquo;</p>
        <p className={styles.attribution}>{trip.builderNote.attribution}</p>
      </div>
    </section>
  );
}
