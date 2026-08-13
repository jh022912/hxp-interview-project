/**
 * Trip content lives here as data, not JSX, so that a plausible Round-2
 * change ("we added a second trip," "the trip sold out, add a waitlist")
 * is a data edit rather than a rearchitecture. Components read from this
 * file; nothing trip-specific is hardcoded into a component.
 *
 * Fictionalized trip, inspired by (not copied from) the real "Brazil
 * Milagre West" listing seen in the HXP screenshots provided for this
 * assignment — same region and general shape (river travel, a community
 * build, a temple visit), different project, dates, and price.
 */

export type CohortStatus = "open" | "waitlist" | "soldOut";

export type Cohort = {
  id: string;
  dateRange: string;
  status: CohortStatus;
  slotsLeft: number;
};

export type ItineraryPhase = {
  label: string;
  description: string;
};

export type Trip = {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  heroKicker: string;
  description: string[];
  ageRange: string;
  durationDays: number;
  priceUsd: number;
  departureAirport: string;
  climate: string;
  visa: string;
  vaccines: string;
  project: {
    title: string;
    description: string;
  };
  included: string[];
  notIncluded: string[];
  itinerary: ItineraryPhase[];
  cohorts: Cohort[];
  builderNote: {
    quote: string;
    attribution: string;
  };
};

export const trips: Trip[] = [
  {
    slug: "brazil-amazon-river",
    name: "Brazil: Amazon River",
    region: "Pará, Brazil",
    tagline: "The hardest two weeks you'll ever be grateful for.",
    heroKicker: "HXP Humanitarian Experience",
    description: [
      "Begin in Belém, then travel by riverboat into the Amazon delta to a river community outside Breves, sleeping in hammocks on deck with the jungle running past on both sides.",
      "Spend your days building a community library and health post alongside local families, and your evenings on the water — canoeing the flooded-forest channels, swimming with the river's pink dolphins, and eating dinner by lantern light.",
      "Finish the trip with a dedication ceremony in the village you built for, then a devotional visit to the Belém do Pará Temple before flying home.",
    ],
    ageRange: "16–19",
    durationDays: 16,
    priceUsd: 4195,
    departureAirport: "Miami International (MIA)",
    climate: "Hot, humid, rainy — 75–95°F",
    visa: "Brazil eVisa (~$90, arranged in advance)",
    vaccines: "None required; yellow fever recommended",
    project: {
      title: "Community library & health post",
      description:
        "A river village outside Breves currently has no covered space for basic medical visits or for kids to read and study. Builders frame, wire, and finish a two-room structure that becomes both — designed with input from the village council so it fits how the community actually lives.",
    },
    included: [
      "Round-trip flights from Miami (MIA)",
      "All lodging — riverboat hammocks + host-family stays in village",
      "All meals in-country",
      "Construction materials and tools",
      "In-country transportation, including riverboat travel",
      "HXP staff and in-country leadership",
      "Travel insurance",
    ],
    notIncluded: [
      "Brazil eVisa fee (~$90)",
      "Spending money for personal items",
      "Optional vaccinations",
    ],
    itinerary: [
      {
        label: "Days 1–2",
        description:
          "Arrive in Belém, meet your group, orientation. Board the riverboat and travel overnight into the delta, hammocks strung on deck.",
      },
      {
        label: "Days 3–10",
        description:
          "Mornings on the build site framing and finishing the library/health post. Afternoons split between an English-conversation club with village kids, canoe trips into várzea channels, and evening swims alongside the river's pink dolphins.",
      },
      {
        label: "Day 11",
        description:
          "Rest day — a soccer match against the village team, followed by a community feijoada dinner.",
      },
      {
        label: "Days 12–13",
        description: "Finish detailing, paint, and furnish the completed space.",
      },
      {
        label: "Day 14",
        description: "Dedication ceremony with the village — the build hands over to the community.",
      },
      {
        label: "Day 15",
        description: "Travel back to Belém; devotional visit to the Belém do Pará Temple.",
      },
      {
        label: "Day 16",
        description: "Fly home from Belém via Miami.",
      },
    ],
    cohorts: [
      { id: "2027-1", dateRange: "Jun 5 – Jun 20, 2027", status: "open", slotsLeft: 6 },
      { id: "2027-2", dateRange: "Jun 19 – Jul 4, 2027", status: "open", slotsLeft: 3 },
      { id: "2027-3", dateRange: "Jul 3 – Jul 18, 2027", status: "open", slotsLeft: 9 },
    ],
    builderNote: {
      quote:
        "I didn't want to come on this trip, but in the end I found that real joy comes from forgetting about myself and serving others — and I made life-long friends in the process.",
      attribution: "— Garren, 17 years old",
    },
  },
];

export function getTripBySlug(slug: string): Trip | undefined {
  return trips.find((trip) => trip.slug === slug);
}
