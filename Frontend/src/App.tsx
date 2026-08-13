import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { TripDetails } from "./components/TripDetails";
import { Itinerary } from "./components/Itinerary";
import { BuilderNote } from "./components/BuilderNote";
import { SignUpForm } from "./components/SignUpForm";
import { Footer } from "./components/Footer";
import { trips } from "./data/trips";

function App() {
  const trip = trips[0];

  return (
    <>
      <Header />
      <main>
        <Hero trip={trip} />
        <TripDetails trip={trip} />
        <Itinerary trip={trip} />
        <BuilderNote trip={trip} />
        <SignUpForm trip={trip} />
      </main>
      <Footer />
    </>
  );
}

export default App;
