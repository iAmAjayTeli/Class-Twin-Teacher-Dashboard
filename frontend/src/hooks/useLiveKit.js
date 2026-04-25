// useLiveKit — hook to fetch a LiveKit token and manage connection metadata

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function useLiveKit() {
  const [token, setToken] = useState(null);
  const [livekitUrl, setLivekitUrl] = useState(import.meta.env.VITE_LIVEKIT_URL || '');
  const [roomName, setRoomName] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Guard to prevent double stopStream calls
  const stoppingRef = useRef(false);

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  /** Teacher: start stream — creates LiveKit room, gets publisher token */
  const startStream = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    stoppingRef.current = false;
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

  /** Teacher: rejoin an already-live stream (page refresh / navigation back) */
  const rejoinStream = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    stoppingRef.current = false;
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/rejoin-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      });
      if (!res.ok) {
        // Session may no longer be streaming — not a hard error
        console.log('Rejoin stream: session not streaming or error');
        return null;
      }
      const data = await res.json();
      setToken(data.token);
      setLivekitUrl(data.url);
      setRoomName(data.roomName);
      setIsStreaming(true);
      return data;
    } catch (err) {
      console.error('Rejoin stream error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Stop stream — guarded against double-calls */
  const stopStream = useCallback(async (sessionId) => {
    // Prevent duplicate calls (DisconnectButton click + onDisconnected event)
    if (stoppingRef.current) {
      console.log('⏩ stopStream already in progress, skipping duplicate call');
      return;
    }
    stoppingRef.current = true;

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/stop-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('stopStream API error:', errText);
      } else {
        console.log('✅ Stream stopped successfully');
      }
    } catch (err) {
      console.error('stopStream network error:', err);
    } finally {
      // Always clean up local state regardless of API success
      setToken(null);
      setRoomName(null);
      setIsStreaming(false);
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
    rejoinStream,
    stopStream,
    getViewerToken,
  };
}
