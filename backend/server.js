// ClassTwin Backend Server — Express + Socket.io

require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const SessionManager = require('./sessionManager');
const { processRound } = require('./riskEngine');
const { getAIInsight } = require('./aiService');
const { supabase, createUserClient } = require('./supabaseClient');
const { generateToken, createRoom, deleteRoom, LIVEKIT_URL } = require('./livekitService');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL || '*'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const sessionManager = new SessionManager();

// ═══════════════════════════════════════════════
// Auth Middleware — verifies Supabase JWT
// ═══════════════════════════════════════════════

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  req.accessToken = token;
  next();
}

// Sample questions
const SAMPLE_QUESTIONS = [
  { text: "What is the base case in recursion?", options: ["The recursive call itself", "The condition where the function stops calling itself", "The return value of the function", "None of the above"], correct: 1, concept: "Recursion Base Case" },
  { text: "What happens if a recursive function has no base case?", options: ["It returns undefined", "It causes a stack overflow", "It runs once and stops", "It optimizes automatically"], correct: 1, concept: "Infinite Recursion" },
  { text: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct: 1, concept: "Binary Search" },
  { text: "Which data structure uses FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], correct: 1, concept: "Queue Data Structure" },
  { text: "What does 'DRY' stand for in programming?", options: ["Do Repeat Yourself", "Don't Repeat Yourself", "Data Retrieval Yield", "Dynamic Resource Yielding"], correct: 1, concept: "DRY Principle" },
  { text: "What is a closure in JavaScript?", options: ["A function that closes the browser", "A function with access to its outer scope", "A terminated function", "A private class method"], correct: 1, concept: "Closures" },
  { text: "What is memoization?", options: ["Memorizing code syntax", "Caching computed results for reuse", "A type of recursion", "Converting memory to disk"], correct: 1, concept: "Memoization" },
  { text: "Which sorting algorithm has the best average case?", options: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"], correct: 2, concept: "Sorting Algorithms" }
];

// ═══════════════════════════════════════════════
// REST API Endpoints
// ═══════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Get teacher profile
app.get('/api/me', authMiddleware, async (req, res) => {
  const userClient = createUserClient(req.accessToken);
  const { data, error } = await userClient
    .from('teachers')
    .select('*')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get all sessions for authenticated teacher (from Supabase)
app.get('/api/sessions', authMiddleware, async (req, res) => {
  const userClient = createUserClient(req.accessToken);
  const { data, error } = await userClient
    .from('sessions')
    .select('*, session_students(count)')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Create a new session (authenticated)
app.post('/api/sessions', authMiddleware, async (req, res) => {
  const { topic, totalRounds } = req.body;
  const session = await sessionManager.createSession({
    topic: topic || 'General',
    teacherId: req.user.id,
    totalRounds: totalRounds || 8,
    questions: SAMPLE_QUESTIONS
  });

  // Persist to Supabase
  try {
    const userClient = createUserClient(req.accessToken);
    const { data: insertedData, error: insertErr } = await userClient.from('sessions').insert({
      id: session.id,
      join_code: session.code,
      topic: session.topic,
      created_by: req.user.id,
      total_rounds: session.totalRounds,
      current_round: session.currentRound,
      status: session.status,
    }).select().single();

    if (insertErr) {
      console.error('❌ Supabase insert error:', insertErr.message, insertErr.details);
    } else {
      console.log(`✅ Session saved to Supabase: ${insertedData.id} (${insertedData.join_code})`);
    }
  } catch (err) {
    console.error('Error persisting session:', err);
  }

  res.json(session);
});

// List Live Sessions (for student app polling) — MUST be before /:code wildcard
app.get('/api/sessions/live', async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, join_code, topic, livekit_room_name, stream_started_at, created_by')
    .eq('is_streaming', true)
    .eq('status', 'active');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Get session by code (public — students use this to join)
app.get('/api/sessions/:code', (req, res) => {
  const session = sessionManager.getSession(req.params.code);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// ═══════════════════════════════════════════════
// LiveKit Token Endpoint (teacher = publisher, student = viewer)
// ═══════════════════════════════════════════════

app.post('/api/livekit/token', async (req, res) => {
  const { roomName, identity, isTeacher = false } = req.body;
  if (!roomName || !identity) {
    return res.status(400).json({ error: 'roomName and identity are required' });
  }
  try {
    const token = await generateToken({ roomName, identity, isTeacher });
    res.json({ token, url: LIVEKIT_URL });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// Start Stream — creates LiveKit room + updates Supabase + broadcasts
// ═══════════════════════════════════════════════

app.post('/api/sessions/:id/start-stream', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userClient = createUserClient(req.accessToken);

  // Fetch session from Supabase to get join_code & topic
  const { data: sessionRow, error: fetchErr } = await userClient
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('created_by', req.user.id)
    .single();

  if (fetchErr || !sessionRow) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const roomName = `classtwin-${sessionRow.join_code}`;

  try {
    // 1. Create LiveKit room
    await createRoom(roomName);

    // 2. Generate teacher token
    const teacherIdentity = `teacher-${req.user.id}`;
    const token = await generateToken({ roomName, identity: teacherIdentity, isTeacher: true });

    // 3. Update Supabase session
    await userClient.from('sessions').update({
      is_streaming: true,
      livekit_room_name: roomName,
      stream_started_at: new Date().toISOString(),
      status: 'active',
    }).eq('id', id);

    // 4. Also update in-memory session manager if it exists
    const inMemSession = sessionManager.getSession(sessionRow.join_code);
    if (inMemSession) {
      inMemSession.isStreaming = true;
      inMemSession.livekitRoomName = roomName;
      inMemSession.status = 'active';
      inMemSession.currentRound = 1;
    }

    // 5. Broadcast to all connected student sockets
    io.emit('session_live', {
      sessionId: id,
      joinCode: sessionRow.join_code,
      topic: sessionRow.topic,
      livekitRoomName: roomName,
      livekitUrl: LIVEKIT_URL,
      streamStartedAt: new Date().toISOString(),
    });

    console.log(`🎥 Stream started: ${roomName} for session ${sessionRow.join_code}`);
    res.json({ token, url: LIVEKIT_URL, roomName });
  } catch (err) {
    console.error('Start stream error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// Stop Stream — deletes LiveKit room + updates Supabase
// ═══════════════════════════════════════════════

app.post('/api/sessions/:id/stop-stream', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userClient = createUserClient(req.accessToken);

  const { data: sessionRow, error: fetchErr } = await userClient
    .from('sessions')
    .select('join_code, livekit_room_name')
    .eq('id', id)
    .single();

  if (fetchErr || !sessionRow) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    if (sessionRow.livekit_room_name) {
      await deleteRoom(sessionRow.livekit_room_name);
    }

    await userClient.from('sessions').update({
      is_streaming: false,
      status: 'ended',
    }).eq('id', id);

    io.emit('session_ended_broadcast', { joinCode: sessionRow.join_code });
    res.json({ success: true });
  } catch (err) {
    console.error('Stop stream error:', err);
    res.status(500).json({ error: err.message });
  }
});



// ═══════════════════════════════════════════════
// WebSocket Events
// ═══════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`📡 Connected: ${socket.id}`);

  // Teacher creates session
  socket.on('create_session', async (data, callback) => {
    const session = await sessionManager.createSession({
      topic: data.topic || 'General',
      teacherId: socket.id,
      totalRounds: data.totalRounds || 8,
      questions: SAMPLE_QUESTIONS
    });
    socket.join(`teacher-${session.code}`);
    socket.sessionCode = session.code;
    socket.role = 'teacher';
    if (callback) callback(session);
  });

  // Student joins session
  socket.on('join', (data, callback) => {
    const { sessionCode, studentName } = data;
    const student = sessionManager.addStudent(sessionCode, {
      id: socket.id,
      name: studentName
    });

    if (!student) {
      if (callback) callback({ error: 'Session not found' });
      return;
    }

    socket.join(`session-${sessionCode}`);
    socket.sessionCode = sessionCode;
    socket.role = 'student';
    socket.studentId = socket.id;

    // Notify teacher
    io.to(`teacher-${sessionCode}`).emit('student_joined', {
      student,
      totalStudents: Object.keys(sessionManager.getSession(sessionCode).students).length
    });

    if (callback) callback({ success: true, student });
  });

  // Teacher starts session
  socket.on('start_session', (data, callback) => {
    const code = data.code || socket.sessionCode;
    const session = sessionManager.startSession(code);
    if (!session) return;

    // Send first question to students
    const question = session.questions[0];
    io.to(`session-${code}`).emit('question', {
      ...question,
      questionId: 0,
      round: session.currentRound,
      timeLimit: 30
    });

    io.to(`teacher-${code}`).emit('round_start', {
      round: session.currentRound,
      totalRounds: session.totalRounds,
      question
    });

    if (callback) callback(session);
  });

  // Student submits answer
  socket.on('answer', async (data) => {
    const { sessionCode, questionId, answer, timeTaken } = data;
    const session = sessionManager.getSession(sessionCode || socket.sessionCode);
    if (!session) return;

    const question = session.questions[questionId] || session.questions[0];
    const correct = answer === question.correct;

    // Record the answer
    sessionManager.recordAnswer(sessionCode || socket.sessionCode, {
      studentId: socket.id,
      questionId,
      answer,
      correct,
      timeTaken: timeTaken || 15,
      concept: question.concept
    });

    // Send feedback to student
    socket.emit('feedback', {
      correct,
      correctAnswer: question.correct,
      encouragement: correct
        ? "Great! You're on track."
        : `The correct answer was: ${question.options[question.correct]}`
    });

    // Process risk engine and send update to teacher
    const riskData = processRound(session.students);
    
    const twinUpdate = {
      students: Object.values(session.students).map(s => ({
        id: s.id,
        name: s.name,
        comprehension: s.comprehension,
        risk: s.risk,
        scoreHistory: s.scoreHistory,
        totalCorrect: s.totalCorrect,
        totalAnswered: s.totalAnswered
      })),
      classHealth: riskData.classAverage,
      heatmap: riskData.heatmap,
      onTrack: riskData.onTrack,
      atRisk: riskData.atRisk,
      highRisk: riskData.highRisk,
      round: session.currentRound,
      totalRounds: session.totalRounds,
      missedConcept: riskData.missedConcept
    };

    // Get AI insights every 2 rounds
    if (session.currentRound % 2 === 0) {
      const insight = await getAIInsight({
        topic: session.topic,
        round: session.currentRound,
        totalRounds: session.totalRounds,
        classAvg: riskData.classAverage,
        onTrack: riskData.onTrack,
        atRisk: riskData.atRisk,
        highRisk: riskData.highRisk,
        missedConcept: riskData.missedConcept,
        trend: riskData.trend
      });
      twinUpdate.aiInsight = insight;
      session.aiInsights[`round_${session.currentRound}`] = insight;
    }

    io.to(`teacher-${sessionCode || socket.sessionCode}`).emit('twin_update', twinUpdate);
  });

  // Teacher advances to next round
  socket.on('next_round', (data, callback) => {
    const code = data.code || socket.sessionCode;
    const session = sessionManager.nextRound(code);
    if (!session) return;

    if (session.status === 'ended') {
      io.to(`session-${code}`).emit('session_ended', { session });
      io.to(`teacher-${code}`).emit('session_ended', { session });
      if (callback) callback(session);
      return;
    }

    // Send next question
    const qIndex = Math.min(session.currentRound - 1, session.questions.length - 1);
    const question = session.questions[qIndex];

    io.to(`session-${code}`).emit('question', {
      ...question,
      questionId: qIndex,
      round: session.currentRound,
      timeLimit: 30
    });

    io.to(`teacher-${code}`).emit('round_start', {
      round: session.currentRound,
      totalRounds: session.totalRounds,
      question
    });

    if (callback) callback(session);
  });

  // Teacher ends session
  socket.on('end_session', (data, callback) => {
    const code = data.code || socket.sessionCode;
    const session = sessionManager.endSession(code);
    if (!session) return;

    io.to(`session-${code}`).emit('session_ended', { session });
    io.to(`teacher-${code}`).emit('session_ended', { session });
    if (callback) callback(session);
  });

  socket.on('disconnect', () => {
    console.log(`📡 Disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 ClassTwin Server running on port ${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}\n`);
});
