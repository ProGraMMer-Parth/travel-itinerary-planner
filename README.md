# Personalized Travel Itinerary Planner

A full-stack starter for a personalized travel itinerary planner.

- **Frontend:** React + Vite + TypeScript
- **Backend:** FastAPI + Python
- **Data:** Supabase (client wiring comes later)

This repository currently contains folder structure and essential starter files only. Travel-planning features are not implemented yet.

## Project structure

```text
frontend/   React app (pages, layouts, components, hooks, services)
backend/    FastAPI app (routes, schemas, services, database, tests)
```

## Prerequisites

- Node.js 20+
- Python 3.11+

## Environment files

Copy the example env files and replace placeholders with your own values. Never commit real `.env` files.

```bash
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
```

On macOS/Linux:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

## Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On macOS/Linux, activate with `source .venv/bin/activate`.

Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

Run tests:

```bash
cd backend
pytest
```
