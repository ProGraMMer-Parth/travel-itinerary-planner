<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Trip Genius AI — an AI-powered travel planner that helps users create, personalize, and save travel itineraries." />
  <title>Trip Genius AI | Project README</title>
  <style>
    :root { color-scheme: light; --ink:#172033; --muted:#5b6578; --brand:#4263eb; --brand2:#14b8a6; --line:#e4e9f2; --surface:#f6f8fc; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:var(--ink); background:#fff; line-height:1.7; }
    a { color:var(--brand); text-decoration:none; } a:hover { text-decoration:underline; }
    .hero { padding:64px 24px 56px; color:white; background:radial-gradient(circle at 85% 20%,rgba(20,184,166,.38),transparent 28%),linear-gradient(135deg,#172554,#273c91 58%,#4263eb); }
    .wrap { width:min(100%,1000px); margin:0 auto; }
    .eyebrow { text-transform:uppercase; letter-spacing:.16em; font-size:.78rem; font-weight:800; opacity:.82; }
    h1 { font-size:clamp(2.4rem,6vw,4.5rem); letter-spacing:-.045em; line-height:1.08; margin:14px 0; }
    .subtitle { max-width:720px; font-size:1.15rem; color:#e7ecff; margin:0 0 26px; }
    .actions { display:flex; flex-wrap:wrap; gap:12px; margin:26px 0 0; }
    .btn { display:inline-block; padding:11px 17px; border-radius:10px; font-weight:750; border:1px solid rgba(255,255,255,.35); color:#fff; background:rgba(255,255,255,.1); }
    .btn.primary { color:#172554; background:#fff; border-color:#fff; }
    main { padding:34px 24px 64px; }
    section { padding:25px 0; border-bottom:1px solid var(--line); }
    h2 { margin:0 0 12px; font-size:1.55rem; letter-spacing:-.025em; }
    h3 { margin:20px 0 8px; font-size:1.08rem; }
    p { margin:9px 0 14px; }
    .muted { color:var(--muted); }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; margin:18px 0; }
    .card { padding:18px; border:1px solid var(--line); border-radius:15px; background:linear-gradient(180deg,#fff,var(--surface)); }
    .card h3 { margin:0 0 7px; }
    .tag { display:inline-block; margin:4px 5px 4px 0; padding:4px 9px; border-radius:999px; background:#eef2ff; color:#3048a5; font-size:.82rem; font-weight:700; }
    code, pre { font-family:ui-monospace,SFMono-Regular,Consolas,monospace; }
    pre { overflow:auto; padding:17px; border-radius:12px; background:#101827; color:#e6edf7; font-size:.9rem; line-height:1.55; }
    .callout { padding:15px 17px; border-left:4px solid var(--brand2); border-radius:0 10px 10px 0; background:#effcf9; }
    ol, ul { padding-left:23px; }
    li { margin:6px 0; }
    footer { padding:24px; text-align:center; color:var(--muted); background:var(--surface); font-size:.92rem; }
    @media (max-width:600px) { .hero { padding:46px 20px; } main { padding:22px 20px 45px; } }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <div class="eyebrow">AI · Travel · Personalization</div>
      <h1>Trip Genius AI</h1>
      <p class="subtitle">Plan smarter journeys with personalized, AI-assisted travel itineraries. Explore destinations, tailor trips to your preferences, and keep your journeys organized in one place.</p>
      <div class="actions">
        <a class="btn primary" href="https://travel-itinerary-planner-0023-b9jioymcx-kumkum18.vercel.app/" target="_blank" rel="noopener noreferrer">Open Live App ↗</a>
        <a class="btn" href="https://github.com/thakurkumkum/travel-itinerary-planner" target="_blank" rel="noopener noreferrer">View Source on GitHub ↗</a>
      </div>
    </div>
  </header>

  <main class="wrap">
    <section>
      <h2>About the Project</h2>
      <p><strong>Trip Genius AI</strong> (also referred to as VoyagePlan during development) is a web-based travel-planning application designed to make trip planning more convenient and personalized. Users can enter travel preferences, generate an itinerary, save trips, revisit them later, and edit their preferences.</p>
      <div class="callout"><strong>Project status:</strong> Deployed application with production smoke tests completed for authentication, itinerary generation, saving trips, editing preferences, and persistence after refresh.</div>
    </section>

    <section>
      <h2>Key Features</h2>
      <div class="grid">
        <article class="card"><h3>🧭 Personalized Planning</h3><p class="muted">Provide destination, travel dates, interests, budget, and travel pace to shape your trip plan.</p></article>
        <article class="card"><h3>✨ AI-Assisted Itineraries</h3><p class="muted">Generate a travel itinerary based on the preferences submitted through the planner.</p></article>
        <article class="card"><h3>🔐 User Authentication</h3><p class="muted">Sign up and sign in to access the application’s user-specific features.</p></article>
        <article class="card"><h3>💾 Saved Trips</h3><p class="muted">Save journeys and access them from the My Trips area, including after refreshing the page.</p></article>
        <article class="card"><h3>📝 Edit Preferences</h3><p class="muted">Reopen a saved trip and load its saved preferences to make changes.</p></article>
        <article class="card"><h3>🌐 Deployed Web App</h3><p class="muted">Frontend hosted on Vercel and backend API hosted on Render.</p></article>
      </div>
    </section>

    <section>
      <h2>Technology Stack</h2>
      <p><span class="tag">React</span><span class="tag">Vite</span><span class="tag">TypeScript / JavaScript</span><span class="tag">FastAPI</span><span class="tag">Python</span><span class="tag">Supabase</span><span class="tag">Groq AI integration</span><span class="tag">Vercel</span><span class="tag">Render</span></p>
      <ul>
        <li><strong>Frontend:</strong> React with Vite for the interactive web interface.</li>
        <li><strong>Backend:</strong> FastAPI provides API endpoints for itinerary generation and related application workflows.</li>
        <li><strong>Authentication and data:</strong> Supabase is integrated for user authentication and trip data persistence.</li>
        <li><strong>AI:</strong> Groq integration is used in the project’s AI itinerary workflow.</li>
        <li><strong>Deployment:</strong> Vercel hosts the frontend; Render hosts the backend service.</li>
      </ul>
      <p class="muted">The exact package versions and provider model can be confirmed from the project’s current dependency files and environment configuration.</p>
    </section>

    <section>
      <h2>How It Works</h2>
      <ol>
        <li>Create an account or sign in.</li>
        <li>Open the planner and enter destination, dates, interests, budget, and pace.</li>
        <li>Submit the preferences to generate an itinerary.</li>
        <li>Review the itinerary and save the trip.</li>
        <li>Open <strong>My Trips</strong> to revisit saved journeys or edit their preferences.</li>
      </ol>
    </section>

    <section>
      <h2>System Architecture</h2>
      <pre>Traveler
   │
   ▼
React + Vite Frontend (Vercel)
   │  HTTPS API requests
   ▼
FastAPI Backend (Render)
   ├── Itinerary generation workflow → Groq AI integration
   └── Authentication / trip data integration → Supabase</pre>
      <p class="muted">This is a high-level overview. It does not expose credentials, internal endpoints, or private environment values.</p>
    </section>

    <section>
      <h2>Run Locally</h2>
      <p>Use the commands below as a general starting point. Check the repository’s current README, package files, and backend requirements for exact scripts and dependencies.</p>
      <h3>1. Clone the repository</h3>
      <pre>git clone https://github.com/thakurkumkum/travel-itinerary-planner.git
cd travel-itinerary-planner</pre>
      <h3>2. Start the backend</h3>
      <p>From the repository root, enter the backend directory and install its requirements:</p>
      <pre>cd backend
python -m venv .venv</pre>
      <p>Activate the virtual environment, then run:</p>
      <pre>pip install -r requirements.txt
uvicorn app.main:app --reload</pre>
      <p>The backend will commonly be available at <code>http://127.0.0.1:8000</code> during local development.</p>
      <h3>3. Start the frontend</h3>
      <p>In a separate terminal, from the repository root:</p>
      <pre>cd frontend
npm install
npm run dev</pre>
      <p>Open the local URL printed by Vite in your terminal.</p>
      <div class="callout"><strong>Environment setup:</strong> Configure the required frontend and backend environment variables locally before running the app. Use your own Supabase project settings and AI-provider credentials. Never commit <code>.env</code> files, private API keys, service-role keys, or production secrets to GitHub.</div>
    </section>

    <section>
      <h2>Deployment</h2>
      <ul>
        <li><strong>Live application:</strong> <a href="https://travel-itinerary-planner-0023-b9jioymcx-kumkum18.vercel.app/" target="_blank" rel="noopener noreferrer">Open Trip Genius AI</a></li>
        <li><strong>Source repository:</strong> <a href="https://github.com/thakurkumkum/travel-itinerary-planner" target="_blank" rel="noopener noreferrer">travel-itinerary-planner on GitHub</a></li>
        <li><strong>Backend hosting:</strong> Render</li>
        <li><strong>Frontend hosting:</strong> Vercel</li>
      </ul>
    </section>

    <section>
      <h2>Production Verification</h2>
      <p>The following end-to-end checks have been reported as passing on the deployed application:</p>
      <ul>
        <li>Sign-up and sign-in</li>
        <li>Itinerary generation</li>
        <li>Saving a trip and seeing it in My Trips</li>
        <li>Loading saved preferences when editing a trip</li>
        <li>Trip persistence after a page refresh</li>
        <li>No critical errors observed in the browser console during testing</li>
      </ul>
      <p class="muted">These are manual smoke-test results, not a claim of formal load, penetration, or independent security testing.</p>
    </section>

    <section>
      <h2>Future Enhancements</h2>
      <ul>
        <li>Richer destination recommendations and activity details.</li>
        <li>More detailed cost breakdowns and budget-aware planning.</li>
        <li>Maps, route optimization, and travel-time estimates.</li>
        <li>Exportable itineraries and shareable trip plans.</li>
        <li>Automated tests, monitoring, and performance improvements.</li>
      </ul>
    </section>

    <section>
      <h2>Contributing</h2>
      <p>Suggestions and improvements are welcome. For changes, create a feature branch, keep credentials out of source control, test the affected workflow, and submit a pull request with a clear summary.</p>
    </section>

    <section>
      <h2>License</h2>
      <p>No license information was provided for this repository. Add a <code>LICENSE</code> file and update this section if you intend to publish the project under a specific open-source license.</p>
    </section>
  </main>
  <footer>
    <div class="wrap">Built with curiosity and AI-assisted development · Trip Genius AI</div>
  </footer>
</body>
</html>
