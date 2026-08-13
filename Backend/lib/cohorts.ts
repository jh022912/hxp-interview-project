/**
 * Server-side source of truth for cohort departure dates. The client sends
 * a cohortId, never a date — the server looks up the date itself here, so
 * eligibility can't be manipulated by a forged request that just lies about
 * what date it's asking about. Mirrors Frontend/src/data/trips.ts's cohort
 * list; duplicated rather than shared for the same reason as eligibility.ts.
 */
const TRIP_COHORT_DEPARTURE_DATES: Record<string, Record<string, string>> = {
  "brazil-amazon-river": {
    "2027-1": "2027-06-05",
    "2027-2": "2027-06-19",
    "2027-3": "2027-07-03",
  },
};

export function getCohortDepartureDate(tripId: string, cohortId: string): string | null {
  return TRIP_COHORT_DEPARTURE_DATES[tripId]?.[cohortId] ?? null;
}
