import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [twinData, setTwinData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to ClassTwin server');
      setConnected(true);
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
      if (data.aiInsight) {
        setAiInsight(data.aiInsight);
      }
      if (data.students) {
        setStudents(data.students);
      }
    });

    socket.on('round_start', (data) => {
      setCurrentRound(data);
    });

    socket.on('session_ended', () => {
      setSessionEnded(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createSession = useCallback((data) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('create_session', data, resolve);
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
    createSession,
    startSession,
    nextRound,
    endSession,
    setStudents,
    setTwinData,
    setAiInsight,
    setSessionEnded,
  };
}
