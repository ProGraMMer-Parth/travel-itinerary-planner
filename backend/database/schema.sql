-- ====================================================================
-- Trip Genius AI: Supabase Database Schema & Row Level Security (RLS)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget NUMERIC,
    travel_style VARCHAR(50),
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure trips_status_check accepts both 'planned' and 'saved' alongside existing statuses
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check CHECK (status IN ('draft', 'planned', 'saved', 'completed'));

-- 3. Itineraries Table
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    itinerary_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_trip_itinerary UNIQUE (trip_id)
);

-- 4. Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- 6. Trips Policies: Users can only CRUD their own trips
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
CREATE POLICY "Users can view own trips"
    ON public.trips FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
CREATE POLICY "Users can insert own trips"
    ON public.trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
CREATE POLICY "Users can update own trips"
    ON public.trips FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
CREATE POLICY "Users can delete own trips"
    ON public.trips FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Itineraries Policies: Users can only CRUD their own itineraries
DROP POLICY IF EXISTS "Users can view own itineraries" ON public.itineraries;
CREATE POLICY "Users can view own itineraries"
    ON public.itineraries FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own itineraries" ON public.itineraries;
CREATE POLICY "Users can insert own itineraries"
    ON public.itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own itineraries" ON public.itineraries;
CREATE POLICY "Users can update own itineraries"
    ON public.itineraries FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own itineraries" ON public.itineraries;
CREATE POLICY "Users can delete own itineraries"
    ON public.itineraries FOR DELETE
    USING (auth.uid() = user_id);
