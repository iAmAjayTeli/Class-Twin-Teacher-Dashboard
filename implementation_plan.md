# ClassTwin → ClassTwin Lingua: Gap Analysis & Implementation Plan

## Project Evolution Summary

**Current state**: ClassTwin — a real-time classroom digital twin with comprehension tracking, quizzes, AI insights, LiveKit video streaming, and student engagement monitoring.

**Target state**: ClassTwin Lingua — everything above **plus** multilingual AI-powered education with real-time translation, regional language chatbot, multilingual assignments, parent reports, and gamification.

---

## Gap Analysis: What Exists vs What's Needed

### ✅ Already Built (Reusable)

| Feature | Existing Implementation |
|---------|------------------------|
| Session creation & QR join | `sessionManager.js`, `StartSessionModal.jsx` |
| Real-time WebSocket sync | `useSocket.js`, Socket.io server |
| LiveKit video streaming | `useLiveKit.js`, `LiveVideoRoom.jsx`, `livekitService.js` |
| Supabase auth (Google OAuth) | `AuthContext.jsx`, `supabase.js` |
| Quiz generation & delivery | Edge Function + `server.js` endpoints |
| AI Twin Chat (Gemini) | `twinChatService.js` with RAG + function calling |
| Comprehension heatmap | `AttentionHeatmap.jsx`, `HeatmapGrid.jsx` |
| Risk engine | `riskEngine.js` |
| Student analytics | `StudentDetailPage.jsx`, `StudentsPage.jsx` |
| Post-session analytics | `PostSessionAnalytics.jsx` |
| Session library & history | `SessionLibrary.jsx`, `AllSessions.jsx` |
| Settings page | `Settings.jsx` |
| Materials page | `Materials.jsx` |
| Landing page | `LandingPage.jsx` |

### 🔴 Missing (Must Build)

| New Feature (from Lingua PRD) | Complexity | Priority |
|-------------------------------|-----------|----------|
| **Language selection on student join** | Medium | P0 — MVP |
| **Real-time two-way translation** (teacher→student) | High | P0 — MVP |
| **AI Regional Language Chatbot** | High | P0 — MVP |
| **Assignment translation & instant feedback** | Medium | P0 — MVP |
| **Language Intelligence Dashboard** (analytics) | Medium | P0 — MVP |
| **Parent Summary Reports** (multilingual) | Medium | P1 — Nice to have |
| **Peer Language Buddy System** | Low | P1 — Nice to have |
| **Streak & Engagement System** (gamification) | Low | P1 — Nice to have |

---

## Proposed Changes — Phased Implementation

> [!IMPORTANT]
> Each phase is self-contained and deployable. We implement **one at a time** as requested.

---

### Phase 1: Language Selection Infrastructure 🌐

**Goal**: Add language preference support throughout the system — database schema, student join flow, teacher dashboard visibility.

#### Database Changes (Supabase)
- Add `preferred_language` column to `session_students` table
- Add `active_languages` column to `sessions` table
- Create `supported_languages` reference table

#### [MODIFY] [server.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/server.js)
- Update student join handler to accept `preferredLanguage`
- Update session creation to include `active_languages`
- Add `/api/languages` endpoint (list supported languages)

#### [MODIFY] [sessionManager.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/sessionManager.js)
- Store student language preference in session state

#### [NEW] `frontend/src/data/languages.js`
- Supported languages config: Kannada, Tamil, Hindi, Telugu, Malayalam, English

#### [MODIFY] [SessionLobby.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/pages/SessionLobby.jsx)
- Show language distribution of joined students (pie chart)
- Display per-student language badge in the roster

#### [MODIFY] [StartSessionModal.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/components/StartSessionModal.jsx)
- Add optional "Expected Languages" multi-select

---

### Phase 2: Real-Time Translation System 🔤

**Goal**: Teacher content → automatically translated to each student's preferred language in real-time.

#### [NEW] `backend/translationService.js`
- Google Translate API integration (or Gemini-based translation)
- `translateText(text, sourceLang, targetLang)` function
- `translateBatch(text, targetLangs[])` for efficiency
- Caching layer to avoid re-translating repeated content

#### [MODIFY] [server.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/server.js)
- New endpoint: `POST /api/sessions/:id/translate-message`
- New WebSocket event: `translated_content` — pushes translated teacher messages to students grouped by language
- Hook into existing `teacher_message` flow to auto-translate

#### [NEW] `frontend/src/components/TranslationPanel.jsx`
- Teacher-side panel showing outgoing message + translation preview
- Language toggle to preview any student's translation

#### [MODIFY] [SessionLobby.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/pages/SessionLobby.jsx)
- Integrate TranslationPanel into the teacher chat area
- Show "Auto-translate" toggle

---

### Phase 3: AI Regional Language Chatbot 🤖

**Goal**: Students can ask doubts in their own language, receive AI explanations in that language.

#### [NEW] `backend/linguaChatService.js`
- Gemini-based multilingual chat handler
- System prompt: "Explain concepts in {language} at student level"
- Conversation history per student per session
- Auto-detect language or use student's preferred language

#### [MODIFY] [server.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/server.js)
- New endpoint: `POST /api/lingua-chat`
- Accepts `{ message, language, sessionId, studentId }`
- Returns AI response in the requested language

#### [MODIFY] [AITutor.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/pages/AITutor.jsx)
- Add language selector dropdown in the chat interface
- Update chat to send/receive in selected language
- Show language badge on each message

#### [NEW] `frontend/src/components/LanguageSelector.jsx`
- Reusable language picker component (dropdown with flags/labels)

---

### Phase 4: Assignment Translation & Instant Feedback 📝

**Goal**: Teacher uploads assignments → auto-translated → students get feedback in their language.

#### [NEW] `backend/assignmentService.js`
- `translateAssignment(content, targetLang)` — Gemini-based content translation
- `generateFeedback(submission, language)` — AI feedback in student's language
- `gradeSubmission(submission, rubric)` — auto-grading with explanations

#### [MODIFY] [server.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/server.js)
- `POST /api/assignments` — create assignment
- `POST /api/assignments/:id/translate` — trigger translation
- `POST /api/assignments/:id/submit` — student submission
- `GET /api/assignments/:id/feedback` — get AI feedback

#### [MODIFY] [Materials.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/pages/Materials.jsx)
- Add "Create Assignment" flow with auto-translate toggle
- Preview translations before publishing
- View submissions and AI-generated feedback

#### Database Changes
- Create `assignments` table (id, session_id, content, language, translated_content)
- Create `assignment_submissions` table (id, assignment_id, student_id, response, feedback, grade)

---

### Phase 5: Language Intelligence Dashboard 📊

**Goal**: Teacher dashboard with language-specific and comprehension analytics.

#### [NEW] `frontend/src/pages/LanguageDashboard.jsx`
- Language distribution pie chart
- Per-language comprehension comparison (bar chart)
- Language-specific engagement heatmap
- Translation usage analytics

#### [NEW] `frontend/src/components/LanguageDistribution.jsx`
- Recharts pie chart showing student language breakdown

#### [NEW] `frontend/src/components/LanguageComprehension.jsx`
- Side-by-side comprehension bars per language group

#### [MODIFY] [server.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/server.js)
- `GET /api/dashboard/language-stats` — aggregated language analytics
- `GET /api/dashboard/language-comprehension` — per-language comprehension data

#### [MODIFY] [Sidebar.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/components/Sidebar.jsx)
- Add "Language Analytics" nav item

#### [MODIFY] [App.jsx](file:///d:/Class-Twin-Teacher-Dashboard/frontend/src/App.jsx)
- Add route: `/language-analytics`

---

### Phase 6: Parent Summary Reports 👨‍👩‍👧 (P1)

**Goal**: Multilingual performance summaries for parents.

#### [NEW] `backend/parentReportService.js`
- Generate session summaries via Gemini
- Translate to parent's preferred language
- Include: attendance, performance, weak areas, teacher remarks

#### [NEW] `frontend/src/pages/ParentReports.jsx`
- Report generator UI for teachers
- Language selection for report output
- PDF/shareable link generation

#### [MODIFY] [server.js](file:///d:/Class-Twin-Teacher-Dashboard/backend/server.js)
- `POST /api/reports/generate` — generate parent report
- `GET /api/reports/:id` — public (shareable) report view

#### Database Changes
- Create `parent_reports` table (id, student_id, session_id, content, translated_content, language)

---

### Phase 7: Gamification & Peer Systems 🔥 (P1)

**Goal**: Streak system, peer language buddy matching.

#### [NEW] `backend/streakService.js`
- Track attendance, quiz, and assignment streaks
- Daily check-in logic

#### [NEW] `backend/buddyService.js`
- AI-powered peer matching based on language, strength, comprehension

#### [NEW] `frontend/src/components/StreakBadge.jsx`
- Visual streak counter component

#### Database Changes
- Add `streak_count`, `last_active` to students table
- Create `buddy_pairs` table

---

## Open Questions

> [!IMPORTANT]
> Please clarify these before we start Phase 1:

1. **Translation API**: Should we use **Google Cloud Translate API** (more accurate, costs money) or **Gemini-based translation** (already have API key, free within limits)? Gemini handles the supported Indian languages well.

2. **Student App**: The new PRD mentions student language selection on join. The current project's student app is a **separate mobile Electron app** (not in this repo). Should we build translation features for:
   - (a) Only the **teacher dashboard** side (this repo)
   - (b) Also the **student-facing** components in this repo
   - (c) We'll update the separate student app later

3. **Landing Page Rebrand**: Should we update the landing page copy from "ClassTwin" to "ClassTwin Lingua" with the new tagline "Breaking Language Barriers in Education with AI"?

4. **Parent Reports**: Are parents actual users who log in, or do teachers generate & share reports via a link?

---

## Verification Plan

### Per-Phase Testing
- Run `npm run dev` and verify no crashes
- Browser-test new UI components
- Test API endpoints via curl/Postman
- Verify Supabase schema migrations

### End-to-End
- Create session → join with language → verify translation flow
- Test AI chatbot in regional languages
- Generate parent reports in multiple languages

---

## Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
 (infra)   (translate) (chatbot) (assign)  (dashboard) (reports) (gamify)
   P0         P0          P0       P0         P0          P1        P1
```

Each phase builds on the previous one. Phase 1 is a prerequisite for all others.
