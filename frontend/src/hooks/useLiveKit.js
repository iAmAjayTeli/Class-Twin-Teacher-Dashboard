// useLiveKit — hook to fetch a LiveKit token and manage connection metadata

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function useLiveKit() {
  const [token, setToken] = useState(null);
  const [livekitUrl, setLivekitUrl] = useState(import.meta.env.VITE_LIVEKIT_URL || '');
  const [roomName, setRoomName] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  /** Teacher: start stream — creates LiveKit room, gets publisher token */
  const startStream = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/start-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setToken(data.token);
      setLivekitUrl(data.url);
      setRoomName(data.roomName);
      setIsStreaming(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Stop stream */
  const stopStream = useCallback(async (sessionId) => {
    try {
      const headers = await getAuthHeader();
      await fetch(`${API_URL}/api/sessions/${sessionId}/stop-stream`, {
        method: 'POST',
        headers,
      });
      setToken(null);
      setRoomName(null);
      setIsStreaming(false);
    } catch (err) {
      console.error('stopStream error:', err);
    }
  }, []);

  /** Student: get viewer token for a room */
  const getViewerToken = useCallback(async (rName, identity) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/livekit/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: rName, identity, isTeacher: false }),
      });
      const data = await res.json();
      setToken(data.token);
      setLivekitUrl(data.url);
      setRoomName(rName);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    token,
    livekitUrl,
    roomName,
    isStreaming,
    loading,
    error,
    startStream,
    stopStream,
    getViewerToken,
  };
}
