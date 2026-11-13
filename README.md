
<H1 align="center">✈️ AI Travel Itinerary Planner</H1>

<p align="center">
  <b>Plan Smarter. Travel Better. Explore More.</b>
</p>

<p align="center">
  An AI-powered travel planning application that generates personalized itineraries based on your destination, travel dates, budget, and preferences.
</p>

<p align="center">
  <a href="https://travel-itinerary-planner-sage.vercel.app/">🌐 Live Demo</a> •
  <a href="https://github.com/ProGraMMer-Parth">💻 GitHub</a> •
  <a href="https://www.linkedin.com/in/parth-ranjan/">LinkedIn</a>
</p>

---

## 🌍 About The Project

**AI Travel Itinerary Planner** is a full-stack web application that simplifies travel planning with Artificial Intelligence.

Users can enter their travel details and preferences to generate personalized travel itineraries without spending hours researching destinations and organizing activities.

The application combines a modern React frontend, FastAPI backend, Supabase authentication and database, and Groq-powered AI generation.

## ✨ Features

- 🤖 **AI-Powered Itinerary Generation** – Generate personalized travel plans using AI.
- 📍 **Destination-Based Planning** – Plan trips based on your preferred destination.
- 📅 **Date-Based Scheduling** – Generate itineraries according to your travel dates.
- 💰 **Budget Preferences** – Customize trips according to your budget.
- 🔐 **User Authentication** – Secure signup and login with Supabase.
- 💾 **Save Trips** – Save generated itineraries to your account.
- 🗂️ **My Trips Dashboard** – View and manage your saved trips.
- 📄 **PDF Export** – Download itineraries as PDF documents.
- 📱 **Responsive UI** – Access the application across different devices.

## 🌐 Live Demo

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://travel-itinerary-planner-sage.vercel.app/) |
| Backend | Render |
| Authentication | Supabase |
| Database | Supabase PostgreSQL |
| AI Provider | Groq |

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite 6
- jsPDF

### Backend
- Python
- FastAPI
- Uvicorn
- Gunicorn
- Pydantic

### Database & Authentication
- Supabase
- PostgreSQL
- Supabase Authentication

### AI Integration
- Groq API
- `openai/gpt-oss-120b`

### Deployment & Tools
- Git
- GitHub
- Vercel
- Render
- Antigravity

## 🏗️ Application Architecture

```text
                 USER
                   |
                   v
          React + TypeScript
             (Frontend)
                   |
                   v
             FastAPI Backend
                   |
          +--------+--------+
          |                 |
          v                 v
       Groq API           Supabase
    (AI Generation)   (Auth + Database)
          |                 |
          +--------+--------+
                   |
                   v
          Personalized Travel
                Itinerary
                   |
                   v
          Save / Manage / Export
```

## 📂 Project Structure

```text
travel-itinerary-planner/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── assets/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
│
└── README.md
```

*Note: The structure above is illustrative. Adjust it to match the actual repository.*

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js and npm
- Python 3.10+
- Git
- Supabase account
- Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/ProGraMMer-Parth/travel-itinerary-planner.git

cd travel-itinerary-planner
```

### 2. Backend Setup

```bash
cd backend

python -m venv .venv
```

Activate the virtual environment.

**Windows:**
```bash
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your backend environment variables in `backend/.env`.

Start the backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend

npm install
```

Configure your frontend environment variables in `frontend/.env`.

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 🔐 Environment Variables

The following are example variable names. Check your actual source code and `.env.example` files for the exact configuration.

### Backend (`backend/.env`)

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://127.0.0.1:8000

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ **Security:** Never commit `.env` files, API keys, or Supabase service-role keys to GitHub. Keep private credentials in your deployment platform's environment settings.

## ☁️ Deployment

The application uses separate deployment platforms.

### Frontend – Vercel

1. Import the GitHub repository into Vercel.
2. Set the frontend root directory.
3. Configure frontend environment variables.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Deploy the application.

### Backend – Render

1. Create a new Web Service on Render.
2. Connect the GitHub repository.
3. Set the backend root directory.
4. Install dependencies using:

```bash
pip install -r requirements.txt
```

5. Configure the backend environment variables.
6. Set the start command according to the backend configuration.
7. Deploy the service.

Make sure your backend CORS configuration allows your deployed frontend domain.

## 🧪 Testing

Run backend tests from the project root:

```bash
pytest backend/tests
```

## 🔮 Future Enhancements

- 🗺️ Interactive maps and route visualization
- 🌦️ Live weather information
- ✈️ Flight and hotel recommendations
- 👥 Collaborative trip planning
- 🌐 Multi-language itinerary generation
- 💵 Detailed travel cost estimation

## 👨‍💻 Author

**Parth Ranjan**

B.Tech – Computer Science & Engineering

Interested in Full-Stack Development, Artificial Intelligence, and building practical technology solutions.

- GitHub: [ProGraMMer-Parth](https://github.com/ProGraMMer-Parth)
- LinkedIn: [Parth Ranjan](https://www.linkedin.com/in/parth-ranjan/)

## ⭐ Support

If you like this project, consider giving the repository a ⭐ on GitHub.

Your feedback and suggestions are always welcome!

---

<p align="center">
  <b>Built with ❤️ using React, FastAPI, Supabase</b>
</p>

