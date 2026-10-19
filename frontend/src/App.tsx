import { useState } from "react";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import PlannerPage from "./pages/PlannerPage";
import ItineraryPage from "./pages/ItineraryPage";

type Page = "home" | "planner" | "itinerary";

function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <AppLayout>
      {page === "home" && <HomePage />}

      {page === "planner" && (
        <PlannerPage
          onBack={() => setPage("home")}
          onGenerate={() => setPage("itinerary")}
        />
      )}

      {page === "itinerary" && (
        <ItineraryPage onBack={() => setPage("planner")} />
      )}
    </AppLayout>
  );
}

export default App;
