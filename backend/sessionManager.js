// ClassTwin Session Manager — Room, QR, and Round Management

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createSession({ topic, teacherId, totalRounds = 8, questions = [] }) {
    const sessionId = uuidv4();
    const sessionCode = this.generateCode();
    
    const session = {
      id: sessionId,
      code: sessionCode,
      topic,
      teacherId,
      totalRounds,
      currentRound: 0,
      status: 'waiting',
      students: {},
      questions,
      aiInsights: {},
      createdAt: new Date(),
      roundStartTime: null
    };

    // Generate QR code
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const joinUrl = `${clientUrl}/join?code=${sessionCode}`;
    session.qrCode = await QRCode.toDataURL(joinUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#e0e2ea', light: '#101419' }
    });
    session.joinUrl = joinUrl;

    this.sessions.set(sessionCode, session);
    return session;
  }

  getSession(code) {
    return this.sessions.get(code);
  }

  getSessionById(id) {
    for (const session of this.sessions.values()) {
      if (session.id === id) return session;
    }
    return null;
  }

  addStudent(code, { id, name }) {
    const session = this.sessions.get(code);
    if (!session) return null;

    session.students[id] = {
      id,
      name,
      comprehension: 50,
      risk: 'ON_TRACK',
      scoreHistory: [],
      lastThreeCorrect: 0,
      avgResponseTime: 15,
      skippedLast2: false,
      lastMissedConcept: null,
      totalCorrect: 0,
      totalAnswered: 0,
      joinedAt: new Date()
    };

    return session.students[id];
  }

  startSession(code) {
    const session = this.sessions.get(code);
    if (!session) return null;
    session.status = 'active';
    session.currentRound = 1;
    session.roundStartTime = Date.now();
    return session;
  }

  nextRound(code) {
    const session = this.sessions.get(code);
    if (!session) return null;
    if (session.currentRound >= session.totalRounds) {
      session.status = 'ended';
      return session;
    }
    session.currentRound++;
    session.roundStartTime = Date.now();
    return session;
  }

  recordAnswer(code, { studentId, questionId, answer, correct, timeTaken, concept }) {
    const session = this.sessions.get(code);
    if (!session || !session.students[studentId]) return null;

    const student = session.students[studentId];
    student.totalAnswered++;
    
    if (correct) {
      student.totalCorrect++;
    } else {
      student.lastMissedConcept = concept;
    }

    // Update last three correct count
    const recentAnswers = student.recentAnswers || [];
    recentAnswers.push(correct ? 1 : 0);
    if (recentAnswers.length > 3) recentAnswers.shift();
    student.recentAnswers = recentAnswers;
    student.lastThreeCorrect = recentAnswers.reduce((a, b) => a + b, 0);

    // Update average response time
    const times = student.responseTimes || [];
    times.push(timeTaken);
    student.responseTimes = times;
    student.avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;

    // Update score history
    const roundScore = student.totalAnswered > 0 
      ? student.totalCorrect / student.totalAnswered 
      : 0.5;
    
    if (student.scoreHistory.length < session.currentRound) {
      student.scoreHistory.push(roundScore);
    } else {
      student.scoreHistory[student.scoreHistory.length - 1] = roundScore;
    }

    // Check if skipped
    student.skippedLast2 = false;

    return student;
  }

  endSession(code) {
    const session = this.sessions.get(code);
    if (!session) return null;
    session.status = 'ended';
    session.endedAt = new Date();
    return session;
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      code: s.code,
      topic: s.topic,
      status: s.status,
      currentRound: s.currentRound,
      totalRounds: s.totalRounds,
      studentCount: Object.keys(s.students).length,
      createdAt: s.createdAt
    }));
  }
}

module.exports = SessionManager;
