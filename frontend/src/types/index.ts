export type Budget = "budget" | "moderate" | "premium" | "luxury";
export type Pace = "relaxed" | "balanced" | "packed";

export type TravelPreferences = {
  destination: string;
  startDate: string;
  endDate: string;
};

export type HealthResponse = {
  status: string;
};

export type ItineraryDay = {
  day_number: number;
  date: string;
  title: string;
  notes: string;
  activities: string[];
};

export type ItineraryGenerateRequest = {
  destination: string;
  start_date: string;
  end_date: string;
  interests: string[];
  budget: Budget;
  pace: Pace;
  demo?: boolean;
};

export type ItineraryGenerateResponse = {
  source: "development_demo" | "groq";
  notice: string;
  destination: string;
  start_date: string;
  end_date: string;
  interests: string[];
  budget: Budget;
  pace: Pace;
  day_count: number;
  days: ItineraryDay[];
};

export type TripSummary = {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: string;
  travel_style?: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type TripDetail = TripSummary & {
  preferences?: Record<string, unknown>;
  itinerary?: ItineraryGenerateResponse | null;
};

export type TripCreatePayload = {
  title?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: Budget;
  pace: Pace;
  interests: string[];
  itinerary: ItineraryGenerateResponse;
};

export type PlannerPreferences = {
  tripId?: string;
  tripTitle?: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: Budget;
  pace: Pace;
  interests: string[];
};
