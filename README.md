# ClassTwin Teacher Dashboard

![ClassTwin Cover](https://via.placeholder.com/1200x400/111827/FFFFFF?text=ClassTwin+Teacher+Dashboard)

An AI-powered, real-time teacher dashboard application that serves as the command center for modern live classrooms. The platform seamlessly integrates live video streaming, AI-generated quizzes, real-time engagement telemetry, and an intelligent AI co-pilot—empowering educators with deep, actionable insights.

## ✨ Features

- **🔴 Live Video Streaming & WebRTC:** Built on top of **LiveKit**, enabling educators to broadcast crystal-clear video to their students with robust auto-rejoin capabilities and live synchronization.
- **🧠 AI-Powered Comprehension Tracking:** Leverages twin-engine AI edge functions to compute real-time classroom telemetry, seamlessly tracking risk profiles, engagement rates, and class health on a dynamic dashboard.
- **🏆 Interactive Real-Time Leaderboards:** Deeply engages students through competitive, real-time leaderboards that evaluate quiz responses, completion speed, and accuracy via WebSockets and Supabase Realtime synchronization.
- **📝 On-The-Fly AI Quiz Generation:** Eliminates lesson prep time by generating high-quality Multiple Choice Questions (MCQs) in real-time using Google's **Gemini 3 Flash** models via secure Supabase Edge Functions.
- **🤖 Live AI Co-pilot (Twin Chat):** Allows the teacher to dialogue with a context-aware AI assistant during the session. The co-pilot acts as a second set of eyes, analyzing student telemetry, recommending immediate interventions, and alerting the teacher to drop-offs in engagement.
- **🎨 Modern "Warm Minimalism" UI:** A beautifully crafted, premium interface built with React. Features include fluid micro-animations, glassmorphism overlays, rich data visualization, and an elegant dark/light theme scheme.

## 🛠 Tech Stack

- **Frontend:** React, Vite, Socket.io-client, LiveKit React Components
- **Backend:** Node.js, Express, Socket.io
- **Database & Auth:** Supabase (PostgreSQL, Google OAuth, Edge Functions)
- **AI Integration:** Google Gemini API (`gemini-3-flash-preview`)
- **Real-Time:** WebSockets, LiveKit (WebRTC)

## 📁 Project Structure

```text
Class-Twin-Teacher-Dashboard/
├── frontend/         # The Vite + React teacher dashboard UI
├── backend/          # Node.js WebSocket backend (session routing, DB resolution)
└── supabase/         # Supabase configuration, DB migrations, and Edge Functions
    └── functions/    # Deno-based Edge Functions (twin-chat, generate-quiz)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- A [Supabase](https://supabase.com/) project
- A [LiveKit](https://livekit.io/) Cloud instance (or local setup)
- A Google Gemini API Key

### 1. Environment Setup

Copy the environment example files in both the frontend and backend directories. Fill them out with your corresponding API keys:

**Backend (`/backend/.env`)**
```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_url
```

**Frontend (`/frontend/.env`)**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

### 2. Running the Backend

```bash
cd backend
npm install
npm run dev
```
*(The backend runs on port `3001` and manages real-time socket connections and LiveKit token negotiation).*

### 3. Running the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```
*(The dashboard will be available at `http://localhost:5173`).*

### 4. Deploying Edge Functions (Optional)

If you are modifying the AI generation scripts, deploy your Supabase Edge Functions using the Supabase CLI:
```bash
npx supabase functions deploy generate-quiz
npx supabase functions deploy twin-chat
npx supabase secrets set GEMINI_API_KEY=your_gemini_key
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---
*Developed for the future of education, blending human teaching with artificial intelligence.*
