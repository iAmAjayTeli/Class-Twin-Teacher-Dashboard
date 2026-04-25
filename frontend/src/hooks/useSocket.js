import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabase';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function useSocket(sessionCode) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [twinData, setTwinData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [classHealth, setClassHealth] = useState(null);
  const [quizResults, setQuizResults] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function connectSocket() {
      // Get current auth session token
      let authToken = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (e) { /* no-op */ }

      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        auth: authToken ? { token: authToken } : undefined,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('🔌 Connected to ClassTwin server');
        setConnected(true);
        if (sessionCode) {
          socket.emit('join_teacher_room', { code: sessionCode }, (res) => {
            console.log(`🏫 Joined teacher room for ${sessionCode}:`, res);
            if (res?.students && res.students.length > 0) {
              setStudents(res.students);
            }
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from ClassTwin server');
        setConnected(false);
      });

      socket.on('student_joined', (data) => {
        setStudents(prev => {
          const exists = prev.find(s => s.id === data.student.id);
          if (exists) return prev;
          return [...prev, data.student];
        });
      });

      socket.on('twin_update', (data) => {
        setTwinData(data);
        if (data.aiInsight) setAiInsight(data.aiInsight);
        if (data.students) setStudents(data.students);
        if (data.classHealth !== undefined) setClassHealth(data.classHealth);
      });

      socket.on('round_start', (data) => {
        setCurrentRound(data);
      });

      socket.on('session_ended', () => {
        setSessionEnded(true);
      });

      socket.on('qr_code', (data) => {
        setQrCode(data.qrCode);
      });

      socket.on('quiz_results_update', (data) => {
        setQuizResults(prev => ({
          ...prev,
          [data.questionId]: {
            totalResponses: data.totalResponses,
            correctCount: data.correctCount,
            incorrectCount: data.incorrectCount,
            correctPercent: data.correctPercent,
            latestAnswer: data.latestAnswer,
          },
        }));
      });

      socket.on('leaderboard_update', (data) => {
        setLeaderboard(data);
      });
    }

    connectSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [sessionCode]);

  const createSession = useCallback(async (data) => {
    // 1. Persist to Supabase via REST (required for start-stream lookup)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession?.access_token) {
        const res = await fetch(`${SOCKET_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const sessionData = await res.json();
          if (sessionData?.qrCode) setQrCode(sessionData.qrCode);
          // Join the teacher socket room for the session code (don't create a duplicate)
          if (sessionData?.code) {
            socketRef.current?.emit('join_teacher_room', { code: sessionData.code }, () => { });
          }
          return sessionData; // { id, code, topic, qrCode, ... }
        }
      }
    } catch (err) {
      console.error('REST createSession failed, falling back to socket', err);
    }

    // Fallback: socket-only (no Supabase, start-stream won't work but rest of app still functions)
    return new Promise((resolve) => {
      socketRef.current?.emit('create_session', data, (response) => {
        if (response?.qrCode) setQrCode(response.qrCode);
        resolve(response);
      });
    });
  }, []);


  const startSession = useCallback((code) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('start_session', { code }, resolve);
    });
  }, []);

  const nextRound = useCallback((code) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('next_round', { code }, resolve);
    });
  }, []);

  const endSession = useCallback((code) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('end_session', { code }, resolve);
    });
  }, []);

  return {
    socket: socketRef.current,
    connected,
    twinData,
    aiInsight,
    currentRound,
    students,
    sessionEnded,
    qrCode,
    classHealth,
    quizResults,
    leaderboard,
    createSession,
    startSession,
    nextRound,
    endSession,
    setStudents,
    setTwinData,
    setAiInsight,
    setSessionEnded,
    setQuizResults,
    setLeaderboard,
  };
}
