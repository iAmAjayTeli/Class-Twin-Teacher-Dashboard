🏆 PROJECT: ClassroomTwin — Real-Time Digital Twin of a Live Classroom
Copy this to your team WhatsApp / Notion / Google Docs

🧠 1. Problem Statement
Teachers have no real-time visibility into whether students are understanding or getting lost
By the time a student fails an exam, it's too late — the signal was there weeks earlier
No system exists that mirrors the cognitive state of a classroom as it happens
Teachers rely on gut feel, not data, to decide when to slow down or revisit a topic
Result: Students fall behind silently. Teachers don't know until it's too late.

💡 2. Solution
ClassroomTwin creates a real-time digital twin of the learning process happening inside a classroom.
Students join via QR code on their phones (no app install needed)
Every 2 minutes, a micro-question is sent to all students
AI builds a live twin of the classroom's collective understanding
Teacher dashboard shows who is lost, who is ahead, and what concept to revisit
AI predicts which students will fail before it happens
Gives teacher real-time nudges: "Slow down here" or "Revisit recursion base case"

🎯 3. Core Features (Final MVP)
📱 A. Student App (Mobile PWA — React)
Join session by scanning QR code or entering 6-digit code
Receive micro-questions every 2 minutes (MCQ or True/False)
See personal status: On Track / At Risk
No login required — just name + session code
💻 B. Teacher Dashboard (React Web App)
Live comprehension heatmap (green / yellow / red per student)
List of HIGH RISK students with reason (e.g., "dropping 3 rounds")
AI insight panel: one action, one concept to revisit, class health score
Round timer and question controls
Auto-updates every 2 minutes via WebSocket
🔌 C. Backend (Node.js + Socket.io)
WebSocket server for real-time answer streaming
Session management: create room, generate QR, manage rounds
Risk engine: scores each student after every round
Calls Claude API every 2 rounds for AI insights
Firebase Firestore for storing session data
🤖 D. AI Twin Engine (Claude API)
Analyzes class comprehension data after each round
Detects which concept caused the most failures
Predicts student-level failure risk
Returns: one teacher action + concept to revisit + class health score (0-100)

⚙️ 4. System Architecture
📱 Student App (React PWA)
      │
      │  answer submitted
      ▼
🔌 WebSocket Server (Node.js + Socket.io)
      │                    │
      │ store data          │ read session state
      ▼                    ▼
🔥 Firebase Firestore    📦 Redis (round state)
      │
      │ every 2 rounds
      ▼
🤖 Claude API (AI Twin Engine)
      │
      │ insights pushed live
      ▼
💻 Teacher Dashboard (React)
      [Heatmap | Risk List | AI Panel | Timer]


🗂️ 5. Folder Structure
classroom-twin/
├── frontend/                        ← Teacher Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeatmapGrid.jsx      ← live comprehension grid
│   │   │   ├── StudentCard.jsx      ← per-student risk card
│   │   │   ├── AIInsightPanel.jsx   ← teacher AI nudges
│   │   │   ├── PredictionBar.jsx    ← who will fail meter
│   │   │   └── QuestionTimer.jsx    ← round countdown
│   │   ├── hooks/
│   │   │   └── useSocket.js         ← WebSocket hook
│   │   └── App.jsx
│
├── student-app/                     ← Student PWA (mobile-first)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── JoinPage.jsx         ← QR scan / code entry
│   │   │   ├── QuizPage.jsx         ← answer micro-questions
│   │   │   └── StatusPage.jsx       ← personal feedback
│   │   └── App.jsx
│
├── backend/
│   ├── server.js                    ← WebSocket + REST API
│   ├── sessionManager.js            ← room, QR, rounds
│   ├── riskEngine.js                ← comprehension scoring
│   └── aiService.js                 ← Claude API calls
│
└── shared/
    └── constants.js                 ← thresholds, timing


🗃️ 6. Firebase Firestore Schema
sessions/
  └── sessionId/
        ├── topic          (string)
        ├── teacherId      (string)
        ├── currentRound   (number)
        ├── totalRounds    (number)
        ├── status         ("active" | "ended")
        ├── createdAt      (timestamp)
        │
        ├── students/
        │     └── studentId/
        │           ├── name           (string)
        │           ├── comprehension  (number 0-100)
        │           ├── risk           ("ON_TRACK" | "AT_RISK" | "HIGH_RISK")
        │           ├── scoreHistory   ([0.8, 0.6, 0.4])
        │           ├── skippedLast2   (boolean)
        │           └── lastAnswerTime (timestamp)
        │
        ├── questions/
        │     └── questionId/
        │           ├── text     (string)
        │           ├── options  ([A, B, C, D])
        │           ├── correct  (string)
        │           └── round    (number)
        │
        └── aiInsights/
              └── round_4/
                    ├── action      (string)
                    ├── revisit     (string)
                    └── healthScore (number)


🧮 7. Risk Engine Logic (IMPORTANT)
Comprehension Score — runs after every round
function calcComprehension(student) {
  const streak = student.lastThreeCorrect   // 0 to 3
  const speed  = student.avgResponseTime    // in seconds
  const trend  = student.scoreHistory       // e.g. [0.8, 0.6, 0.4]

  const score =
    (streak / 3 * 50) +                           // accuracy = 50%
    (Math.max(0, 30 - speed) / 30 * 30) +         // speed = 30%
    (trendBonus(trend) * 20)                       // trend = 20%

  return Math.round(score)   // 0-100
}

function trendBonus(history) {
  if (history.length < 2) return 0.5
  const delta = history[history.length - 1] - history[0]
  if (delta > 0)    return 1    // improving
  if (delta < -0.2) return 0    // dropping fast
  return 0.5                    // stable
}

Failure Prediction — runs after round 3+
function predictFailure(student, classAverage) {
  const dropping = student.scoreHistory.every(
    (v, i, a) => i === 0 || v <= a[i - 1]
  )
  const belowAvg = student.comprehension < classAverage - 15
  const silent   = student.skippedLast2

  if (dropping && belowAvg) return "HIGH_RISK"
  if (belowAvg || silent)   return "AT_RISK"
  return "ON_TRACK"
}

Risk Color Mapping
Status
Color
Meaning
ON_TRACK
🟢 Green
All good
AT_RISK
🟡 Yellow
Needs attention
HIGH_RISK
🔴 Red
Likely to fail — intervene now


🤖 8. AI Assistant — Claude API Integration
Prompt Template (runs every 2 rounds)
const prompt = `
You are an AI teaching assistant analyzing a live classroom session.

Topic: "${session.topic}"
Round: ${session.round} of ${session.totalRounds}

Class comprehension data:
- Average score: ${classAvg}%
- Students ON_TRACK: ${onTrack}
- Students AT_RISK: ${atRisk}
- Students HIGH_RISK: ${highRisk}
- Most missed concept this round: "${missedConcept}"
- Class trend: ${trend}

Give the teacher:
1. One specific action to take RIGHT NOW (max 12 words)
2. One concept to revisit (exact name)
3. A class health score from 0 to 100

Respond ONLY in JSON. No extra text, no markdown:
{
  "action": "...",
  "revisit": "...",
  "healthScore": 72
}
`

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }]
  })
})


🔌 9. WebSocket Events Reference
Student → Server
socket.emit('join',   { sessionCode, studentName })
socket.emit('answer', { studentId, questionId, answer, timeTaken })

Server → Teacher Dashboard
socket.emit('twin_update', {
  students: [
    { id, name, comprehension: 72, risk: "AT_RISK", scoreHistory: [0.9, 0.7, 0.5] },
    ...
  ],
  classHealth: 68,
  aiInsight: {
    action:      "Slow down — 8 students lost on recursion",
    revisit:     "Base case in recursion",
    healthScore: 68
  },
  heatmap: [[80, 45, 90, 30, 75], [60, 80, 55, 40, 85]]
})

Server → Student
socket.emit('question', {
  text:      "What is the base case in recursion?",
  options:   ["A. The recursive call", "B. When function stops calling itself", "C. The return value", "D. None"],
  timeLimit: 30
})

socket.emit('feedback', {
  correct:       true,
  encouragement: "Great! You're on track."
})


🎨 10. UI Design
Teacher Dashboard Layout
┌────────────────────────────────────────────────────────┐
│  ClassTwin  •  Topic: Recursion  •  Round 4/8          │
│  Class Health: ████████░░ 68%  🟡 Needs Attention       │
│  Next round in: 01:45                                   │
├────────────────────────────────────────────────────────┤
│  🤖 AI: "Revisit base case — 8 students are lost"      │
│  Action: Slow down and re-explain base case now         │
├─────────────────────┬──────────────────────────────────┤
│  HEATMAP            │  HIGH RISK (2)                    │
│  🟢 🟢 🟡 🔴 🟢   │  ⚠ Rahul — dropping 3 rounds      │
│  🟢 🟡 🟡 🟢 🟢   │  ⚠ Priya — skipped last 2         │
│  🔴 🟢 🟢 🟡 🟢   │                                    │
│                     │  AT RISK (5) · ON TRACK (18)      │
└─────────────────────┴──────────────────────────────────┘

Student App Layout (Mobile)
┌──────────────────────┐
│  Session: ABC123     │
│  Round 4 · 00:22 ⏱  │
├──────────────────────┤
│  Q: What is the      │
│  base case in        │
│  recursion?          │
│                      │
│  ○ A. Recursive call │
│  ○ B. When it stops  │  ← tap to answer
│  ○ C. Return value   │
│  ○ D. None of above  │
│                      │
│  [  SUBMIT  ]        │
├──────────────────────┤
│  🟢 You're on track! │
└──────────────────────┘


⏱️ 11. 24-Hour Build Plan
Hours
Task
Owner
0–1
Wireframe + repo setup + Firebase config
All together
1–4
WebSocket server: join, session, QR code
Person 2 (Backend)
1–4
Student PWA: join page + answer UI
Person 3 (AI/Data)
4–8
Real-time sync: answers flow to dashboard
Person 2
4–8
Dashboard: skeleton + student cards
Person 1 (Frontend)
8–12
Risk engine: comprehension score + prediction
Person 2
8–12
Claude API integration + prompt
Person 3
12–16
Heatmap component + AI insight panel on dashboard
Person 1
16–18
HIGH RISK highlighting + red cards
Person 1
18–20
QR code generation + session flow polish
Person 2
20–22
Full end-to-end test with 3 phones
All
22–23
UI polish: colors, animations, loading states
Person 1
23–24
Demo rehearsal + pitch script practice
All


👥 12. Team Roles
👤 Person 1 — Frontend (Teacher Dashboard)
Owns:
React dashboard app
HeatmapGrid component (colored cells per student)
AIInsightPanel (action + revisit + health score)
StudentCard (name, score, risk badge)
PredictionBar (who will fail)
QuestionTimer + round display
Connects to WebSocket using useSocket.js hook
Key files: HeatmapGrid.jsx, AIInsightPanel.jsx, StudentCard.jsx, App.jsx

👤 Person 2 — Backend + WebSocket
Owns:
Node.js server with Socket.io
Session creation + QR code generation (qrcode npm package)
Room management: student join, round timer, question push
Risk engine logic (comprehension score + failure prediction)
Pushes twin_update event to teacher dashboard every 2 minutes
Firebase Firestore read/write
Key files: server.js, sessionManager.js, riskEngine.js

👤 Person 3 — AI + Student App
Owns:
Student PWA (React, mobile-first CSS)
JoinPage: enter name + session code / scan QR
QuizPage: display question, handle answer submission, countdown
StatusPage: show personal feedback after each round
Claude API integration (aiService.js)
Builds prompt, calls API, parses JSON response
Pushes AI insight to teacher via WebSocket
Key files: aiService.js, JoinPage.jsx, QuizPage.jsx, StatusPage.jsx

🛠️ 13. Tech Stack
Layer
Tool
Why
Student app
React PWA
Works on any phone, zero install
Teacher UI
React + Recharts
Heatmap + live charts
WebSocket
Socket.io (Node.js)
Easiest real-time setup, well documented
AI
Claude API (claude-sonnet-4-20250514)
Best structured JSON output
Database
Firebase Firestore
No setup time, real-time sync built-in
QR Code
qrcode npm package
One line to generate
Frontend hosting
Vercel
Free, deploys in 2 minutes
Backend hosting
Railway
Free, Node.js deploy in 5 minutes


📦 14. Quick Setup Commands
# Clone and install
git clone https://github.com/yourteam/classroom-twin
cd classroom-twin

# Backend
cd backend
npm install express socket.io firebase-admin qrcode cors dotenv
node server.js

# Frontend (Teacher Dashboard)
cd ../frontend
npm create vite@latest . -- --template react
npm install socket.io-client recharts
npm run dev

# Student App
cd ../student-app
npm create vite@latest . -- --template react
npm install socket.io-client
npm run dev

Environment Variables (.env)
ANTHROPIC_API_KEY=your_key_here
FIREBASE_PROJECT_ID=your_project
FIREBASE_PRIVATE_KEY=your_key
FIREBASE_CLIENT_EMAIL=your_email
PORT=3001


🎬 15. Demo Script (Practice This Word for Word)
Step 1 — The Hook (30 seconds)
Say:
"Every teacher in this room has lost a student mid-lesson and didn't know until the exam. We built the system that tells you in real time. It's not just a dashboard — it's a digital twin of the classroom's mind."
Step 2 — Judge Participation (60 seconds)
Show QR code on screen
Ask judges: "Please scan this and enter your name"
Watch their names appear live on the dashboard
Send 2 quick questions — watch the heatmap update in real time
Say: "You just became part of the twin."
Step 3 — Trigger the Risk Alert (30 seconds)
One teammate on a phone rapidly submits wrong answers for 3 rounds
The student card turns RED on the dashboard
Say: "Watch — Rahul has been dropping for 3 consecutive rounds. The twin just flagged him as HIGH RISK."
Step 4 — Show the AI Insight (30 seconds)
Point to the AI panel
Say: "Our AI analyzed the class and says: 'Revisit recursion base cases — 6 students are about to lose this concept.' The teacher gets this nudge in real time, not after the exam."
Step 5 — The Close (20 seconds)
"This is what a digital twin of learning looks like. Not a building, not a city — the most complex system in any room: 30 human minds trying to understand something new. ClassroomTwin gives teachers a brain, not just a board."

⚠️ 16. DO and DON'T
✅ DO
Get real-time sync working by hour 8 — this is your foundation
Test the demo flow with 3 actual phones before hour 20
Make the QR join as smooth as possible — judges will use it
Keep the dashboard clean — one heatmap, one AI panel, one risk list
Have sample session data ready to load if live demo has issues
❌ DON'T
Don't add features after hour 18 — only polish and fix bugs
Don't make the student app complex — just name, join, answer, done
Don't call Claude API more than once per round — rate limits hurt
Don't use complex animations on the heatmap — keep it simple
Don't hardcode questions — have at least 8 generic questions ready

🏆 17. Why This Will Win
💡 True digital twin concept — twinning a cognitive process, not just physical infrastructure. Nobody else thinks this way
🤖 AI + real-time — Claude gives actionable, specific nudges every 2 minutes
🎬 Judges participate in the demo — they see themselves on the twin dashboard. That moment wins the room
📱 Zero friction — no app install, just scan QR and answer. Works immediately
🏫 Real world problem — every school, every college, every tutor has this problem
⚡ Buildable in 24 hours — no external APIs that can break, no complex datasets needed, everything works in the room

🚀 18. Pitch Line (Memorize This)
"ClassroomTwin creates a real-time digital twin of a classroom — not the building, but the minds inside it. It tells teachers who is lost, what concept broke them, and what to do right now — before a single student fails."

💥 19. Answer When Judges Ask "Is This Actually a Digital Twin?"
"A digital twin is a real-time virtual replica that mirrors a physical system's current state and predicts its future states. We're not twinning a building — we're twinning the most complex system in that building: 30 human minds trying to learn simultaneously. Our twin updates every 2 minutes, reflects each student's true comprehension state, and predicts failure before it happens — exactly what industrial twins do for machines. We just applied it to cognition."

Last updated: Built for hackathon — 3 person team, 24 hours Track: 01 — AI & Intelligent Digital Twins

