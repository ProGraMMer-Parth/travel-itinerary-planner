import { useCallback, useEffect, useState } from "react";
import AuthModal from "./components/auth/AuthModal";
import { AuthProvider } from "./hooks/useAuth";
import AppLayout, { type NavigationTarget } from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import ItineraryPage from "./pages/ItineraryPage";
import MyTripsPage from "./pages/MyTripsPage";
import PlannerPage from "./pages/PlannerPage";
import type {
  Budget,
  ItineraryGenerateResponse,
  Pace,
  PlannerPreferences,
  TripDetail,
} from "./types";

type Page = "home" | "planner" | "itinerary" | "my-trips";

function extractPlannerPreferences(tripDetail: TripDetail): PlannerPreferences {
  const itin = tripDetail.itinerary;
  const prefs = tripDetail.preferences as Record<string, unknown> | undefined;

  const destination = tripDetail.destination || itin?.destination || "";
  const startDate = tripDetail.start_date || itin?.start_date || "";
  const endDate = tripDetail.end_date || itin?.end_date || "";

  // Validate budget
  const rawBudget = String(
    itin?.budget || prefs?.budget || tripDetail.budget || "moderate"
  ).toLowerCase();
  const validBudgets: Budget[] = ["budget", "moderate", "premium", "luxury"];
  const budget: Budget = validBudgets.includes(rawBudget as Budget)
    ? (rawBudget as Budget)
    : "moderate";

  // Validate pace
  const rawPace = String(
    itin?.pace || prefs?.pace || tripDetail.travel_style || "balanced"
  ).toLowerCase();
  const validPaces: Pace[] = ["relaxed", "balanced", "packed"];
  const pace: Pace = validPaces.includes(rawPace as Pace)
    ? (rawPace as Pace)
    : "balanced";

  // Validate interests
  let rawInterests: string[] = [];
  if (Array.isArray(itin?.interests) && itin.interests.length > 0) {
    rawInterests = itin.interests;
  } else if (Array.isArray(prefs?.interests) && prefs.interests.length > 0) {
    rawInterests = prefs.interests as string[];
  } else {
    rawInterests = ["Culture"];
  }

  return {
    tripId: tripDetail.id,
    tripTitle: tripDetail.title,
    destination,
    startDate,
    endDate,
    budget,
    pace,
    interests: rawInterests,
  };
}

function AppContent() {
  const [page, setPage] = useState<Page>("home");
  const [destination, setDestination] = useState("");
  const [itinerary, setItinerary] =
    useState<ItineraryGenerateResponse | null>(null);
  const [savedTrip, setSavedTrip] = useState<TripDetail | null>(null);
  const [plannerPreferences, setPlannerPreferences] =
    useState<PlannerPreferences | null>(null);
  const [isItinerarySaved, setIsItinerarySaved] = useState(false);
  const [tripsVersion, setTripsVersion] = useState(0);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const navigateTo = useCallback(
    (target: NavigationTarget) => {
      if (target === "destinations" || target === "how-it-works") {
        setPage("home");
        if (window.location.hash !== `#${target}`) {
          window.location.hash = target;
        }
        setTimeout(() => {
          const el = document.getElementById(target);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 60);
        return;
      }

      if (target === "home") {
        setPage("home");
        if (window.location.hash !== "#home" && window.location.hash !== "") {
          window.location.hash = "home";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (target === "planner") {
        setPage("planner");
        if (window.location.hash !== "#planner") {
          window.location.hash = "planner";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (target === "itinerary") {
        setPage("itinerary");
        if (window.location.hash !== "#itinerary") {
          window.location.hash = "itinerary";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (target === "my-trips") {
        setPage("my-trips");
        if (window.location.hash !== "#my-trips") {
          window.location.hash = "my-trips";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    []
  );

  // Sync page state on browser back/forward and initial page URL hash
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "my-trips") {
        setPage("my-trips");
      } else if (hash === "planner") {
        setPage("planner");
      } else if (hash === "itinerary") {
        setPage("itinerary");
      } else if (hash === "destinations" || hash === "how-it-works") {
        setPage("home");
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        }, 60);
      } else if (hash === "home" || !hash) {
        setPage("home");
      }
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function handlePlanTripFromHome(dest: string, initialInterests?: string[]) {
    // Brand new trip: reset saved trip and edit preferences
    setSavedTrip(null);
    setItinerary(null);
    setIsItinerarySaved(false);
    setDestination(dest);
    const selectedInterests =
      initialInterests && initialInterests.length > 0
        ? initialInterests
        : ["Culture"];
    setPlannerPreferences({
      destination: dest,
      startDate: "",
      endDate: "",
      budget: "moderate",
      pace: "balanced",
      interests: selectedInterests,
    });
    navigateTo("planner");
  }

  function handlePlanNewTrip() {
    // Brand new trip: reset saved trip and edit preferences
    setSavedTrip(null);
    setPlannerPreferences(null);
    setItinerary(null);
    setIsItinerarySaved(false);
    setDestination("");
    navigateTo("planner");
  }

  function handleGenerate(
    dest: string,
    generatedItinerary: ItineraryGenerateResponse,
  ) {
    setDestination(dest);
    setItinerary(generatedItinerary);
    setIsItinerarySaved(false); // Newly generated revision is not yet saved
    // Keep planner preferences updated with the generated data
    setPlannerPreferences((prev: PlannerPreferences | null) => ({
      destination: dest,
      startDate: generatedItinerary.start_date,
      endDate: generatedItinerary.end_date,
      budget: generatedItinerary.budget,
      pace: generatedItinerary.pace,
      interests: generatedItinerary.interests,
      tripId: prev?.tripId,
      tripTitle: prev?.tripTitle,
    }));
    navigateTo("itinerary");
  }

  function handleOpenTrip(tripDetail: TripDetail) {
    // Load saved trip and its full 6 preference fields
    setSavedTrip(tripDetail);
    const prefs = extractPlannerPreferences(tripDetail);
    setPlannerPreferences(prefs);
    setDestination(prefs.destination);
    setItinerary(tripDetail.itinerary || null);
    setIsItinerarySaved(true);
    navigateTo("itinerary");
  }

  function handleSaveSuccess(updatedTrip: TripDetail) {
    setSavedTrip(updatedTrip);
    setIsItinerarySaved(true);
    const prefs = extractPlannerPreferences(updatedTrip);
    setPlannerPreferences(prefs);
    setDestination(prefs.destination);
    setTripsVersion((v) => v + 1);
  }

  function handleEditPreferencesFromItinerary() {
    // Navigate to planner with the saved trip's preferences prefilled
    navigateTo("planner");
  }

  function handleOpenAuth(mode: "signin" | "signup" = "signin") {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }

  return (
    <AppLayout
      activePage={page}
      onNavigate={navigateTo}
      onOpenAuth={() => handleOpenAuth("signin")}
    >
      {page === "home" && <HomePage onPlanTrip={handlePlanTripFromHome} />}

      {page === "planner" && (
        <PlannerPage
          initialDestination={destination}
          initialPreferences={plannerPreferences}
          onBack={() => {
            if (savedTrip && itinerary) {
              navigateTo("itinerary");
            } else {
              navigateTo("home");
            }
          }}
          onGenerate={handleGenerate}
        />
      )}

      {page === "itinerary" && (
        <ItineraryPage
          destination={destination}
          itinerary={itinerary}
          savedTripId={savedTrip?.id}
          savedTripTitle={savedTrip?.title}
          isSaved={isItinerarySaved}
          onSaveSuccess={handleSaveSuccess}
          onBack={() => {
            if (savedTrip) {
              navigateTo("my-trips");
            } else {
              navigateTo("planner");
            }
          }}
          onEditPreferences={handleEditPreferencesFromItinerary}
          onViewMyTrips={() => navigateTo("my-trips")}
          onSignInRequired={() => handleOpenAuth("signin")}
        />
      )}

      {page === "my-trips" && (
        <MyTripsPage
          refreshKey={tripsVersion}
          onOpenTrip={handleOpenTrip}
          onPlanNewTrip={handlePlanNewTrip}
          onSignInRequired={() => handleOpenAuth("signin")}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
