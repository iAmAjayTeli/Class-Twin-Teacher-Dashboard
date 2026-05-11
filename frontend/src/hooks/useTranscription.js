import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useTranscription — Custom hook for real-time speech-to-text
 * using the Web Speech API (SpeechRecognition).
 * 
 * Captures teacher's speech in real-time during a live session,
 * emits transcript segments for translation pipeline.
 * 
 * Uses a dual approach for low-latency:
 * - Final transcripts are sent immediately
 * - Interim text is sent after a short debounce (1.5s) if no final arrives
 * 
 * @param {Object} options
 * @param {string} options.language - BCP 47 language code (e.g., 'en-IN')
 * @param {function} options.onTranscript - Callback fired with each finalized transcript segment
 * @param {function} options.onInterim - Callback fired with interim (partial) results
 * @param {boolean} options.enabled - Whether to start recognition
 */
export default function useTranscription({
  language = 'en-IN',
  onTranscript,
  onInterim,
  enabled = false,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const enabledRef = useRef(enabled);
  const restartTimeoutRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);
  const interimDebounceRef = useRef(null);
  const lastSentInterimRef = useRef('');

  // Keep refs in sync
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('🎤 Speech recognition started');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        // Clear any pending interim debounce — the final supersedes it
        if (interimDebounceRef.current) {
          clearTimeout(interimDebounceRef.current);
          interimDebounceRef.current = null;
        }
        lastSentInterimRef.current = '';

        if (onTranscriptRef.current) {
          onTranscriptRef.current(finalTranscript.trim());
        }
      }
      
      if (interimTranscript && onInterimRef.current) {
        onInterimRef.current(interimTranscript.trim());
        
        // Debounce: if interim text is long enough and stable for 1.5s, send it
        // This gives faster feedback while still waiting for finals
        if (interimTranscript.trim().split(' ').length >= 3) {
          if (interimDebounceRef.current) {
            clearTimeout(interimDebounceRef.current);
          }
          interimDebounceRef.current = setTimeout(() => {
            const text = interimTranscript.trim();
            // Only send if we haven't already sent this exact text
            if (text !== lastSentInterimRef.current && text.length > 5 && onTranscriptRef.current) {
              lastSentInterimRef.current = text;
              console.log('⚡ Sending interim for early translation:', text.substring(0, 40));
              onTranscriptRef.current(text);
            }
          }, 1500);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        console.warn('Speech recognition error:', event.error);
        setError('Microphone access denied. Please allow microphone permissions.');
        setIsListening(false);
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Normal — silence timeout or restart cycle, ignore silently
      } else if (event.error === 'network') {
        console.warn('Speech recognition error:', event.error);
        setError('Network error — speech recognition requires internet.');
      } else {
        console.warn('Speech recognition error:', event.error);
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled (recognition stops after ~60s of silence)
      if (enabledRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (enabledRef.current) {
            console.log('🔄 Auto-restarting speech recognition...');
            startListening();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition');
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (interimDebounceRef.current) {
      clearTimeout(interimDebounceRef.current);
      interimDebounceRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    lastSentInterimRef.current = '';
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && supported) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, supported]);

  return {
    isListening,
    error,
    supported,
    startListening,
    stopListening,
  };
}
