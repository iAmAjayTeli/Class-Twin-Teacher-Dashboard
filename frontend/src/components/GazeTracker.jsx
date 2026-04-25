import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

// Iris landmark indices (MediaPipe FaceMesh 478 model)
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;


// Head pose landmarks
const NOSE_TIP = 1;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

function estimateGaze(landmarks) {
  if (!landmarks || landmarks.length < 478) return null;

  // Get iris centers
  const leftIrisCenter = {
    x: LEFT_IRIS.reduce((s, i) => s + landmarks[i].x, 0) / LEFT_IRIS.length,
    y: LEFT_IRIS.reduce((s, i) => s + landmarks[i].y, 0) / LEFT_IRIS.length,
  };
  const rightIrisCenter = {
    x: RIGHT_IRIS.reduce((s, i) => s + landmarks[i].x, 0) / RIGHT_IRIS.length,
    y: RIGHT_IRIS.reduce((s, i) => s + landmarks[i].y, 0) / RIGHT_IRIS.length,
  };

  // Get eye bounding box corners
  const leftEyeWidth = Math.abs(landmarks[LEFT_EYE_OUTER].x - landmarks[LEFT_EYE_INNER].x);
  const leftEyeHeight = Math.abs(landmarks[LEFT_EYE_TOP].y - landmarks[LEFT_EYE_BOTTOM].y);
  const rightEyeWidth = Math.abs(landmarks[RIGHT_EYE_INNER].x - landmarks[RIGHT_EYE_OUTER].x);
  const rightEyeHeight = Math.abs(landmarks[RIGHT_EYE_TOP].y - landmarks[RIGHT_EYE_BOTTOM].y);

  // Normalize iris position within eye (0 = left/top, 1 = right/bottom)
  const leftGazeX = (leftIrisCenter.x - landmarks[LEFT_EYE_OUTER].x) / (leftEyeWidth || 0.001);
  const leftGazeY = (leftIrisCenter.y - landmarks[LEFT_EYE_TOP].y) / (leftEyeHeight || 0.001);
  const rightGazeX = (rightIrisCenter.x - landmarks[RIGHT_EYE_OUTER].x) / (rightEyeWidth || 0.001);
  const rightGazeY = (rightIrisCenter.y - landmarks[RIGHT_EYE_TOP].y) / (rightEyeHeight || 0.001);

  // Average both eyes
  let gazeX = (leftGazeX + rightGazeX) / 2;
  let gazeY = (leftGazeY + rightGazeY) / 2;

  // Add head pose compensation
  const headYaw = landmarks[NOSE_TIP].x - 0.5; // deviation from center
  const headPitch = landmarks[NOSE_TIP].y - 0.5;

  // Combine iris gaze with head direction (weighted)
  gazeX = gazeX * 0.6 + (0.5 + headYaw * 1.5) * 0.4;
  gazeY = gazeY * 0.6 + (0.5 + headPitch * 1.5) * 0.4;

  // Clamp to 0-1
  gazeX = Math.max(0, Math.min(1, gazeX));
  gazeY = Math.max(0, Math.min(1, gazeY));

  // Mirror X since webcam is mirrored
  gazeX = 1 - gazeX;

  return { x: gazeX, y: gazeY };
}

export default function GazeTracker({ onGazeData, enabled = true, showPreview = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const lastSendRef = useRef(0);
  const [status, setStatus] = useState('initializing'); // initializing | loading | tracking | error | paused
  const [gazePoint, setGazePoint] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    if (!enabled) {
      setStatus('paused');
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        setStatus('loading');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (cancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

        if (cancelled) return;
        faceLandmarkerRef.current = landmarker;

        // Start webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setStatus('tracking');
            detectFrame();
          };
        }
      } catch (err) {
        console.error('GazeTracker init error:', err);
        setStatus('error');
      }
    }

    function detectFrame() {
      if (cancelled || !faceLandmarkerRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) {
        animationRef.current = requestAnimationFrame(detectFrame);
        return;
      }

      const now = performance.now();
      const result = faceLandmarkerRef.current.detectForVideo(video, now);

      if (result?.faceLandmarks?.length > 0) {
        const landmarks = result.faceLandmarks[0];
        setFaceDetected(true);

        const gaze = estimateGaze(landmarks);
        if (gaze) {
          setGazePoint(gaze);

          // Send gaze data at ~2Hz (every 500ms)
          if (now - lastSendRef.current > 500) {
            lastSendRef.current = now;
            onGazeData?.(gaze);
          }
        }

        // Draw landmarks on canvas
        if (canvasRef.current && showPreview) {
          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          const drawingUtils = new DrawingUtils(ctx);

          // Draw iris circles
          [...LEFT_IRIS, ...RIGHT_IRIS].forEach(idx => {
            const lm = landmarks[idx];
            ctx.beginPath();
            ctx.arc(lm.x * canvasRef.current.width, lm.y * canvasRef.current.height, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#4ae176';
            ctx.fill();
          });
        }
      } else {
        setFaceDetected(false);
      }

      animationRef.current = requestAnimationFrame(detectFrame);
    }

    init();

    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      faceLandmarkerRef.current?.close();
    };
  }, [enabled, onGazeData, showPreview]);

  if (!enabled) return null;

  return (
    <div style={{
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      backgroundColor: 'var(--surface-container)',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: status === 'tracking' && faceDetected ? '#4ae176'
            : status === 'tracking' ? '#ffb95f'
              : status === 'loading' ? '#c0c1ff'
                : '#ff6b6b',
          boxShadow: status === 'tracking' && faceDetected
            ? '0 0 8px rgba(74, 225, 118, 0.5)'
            : 'none',
          animation: status === 'loading' ? 'pulse-glow 1.5s infinite' : 'none',
        }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
          {status === 'loading' ? 'Loading AI model...'
            : status === 'tracking' && faceDetected ? 'Tracking Active'
              : status === 'tracking' ? 'No face detected'
                : status === 'error' ? 'Camera error'
                  : 'Initializing...'}
        </span>
        {gazePoint && status === 'tracking' && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(192, 193, 255, 0.5)', fontFamily: 'monospace' }}>
            ({gazePoint.x.toFixed(2)}, {gazePoint.y.toFixed(2)})
          </span>
        )}
      </div>

      {/* Video + Overlay */}
      {showPreview && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              transform: 'scaleX(-1)',
              pointerEvents: 'none',
            }}
          />

          {/* Gaze direction indicator */}
          {gazePoint && faceDetected && (
            <div style={{
              position: 'absolute',
              left: `${gazePoint.x * 100}%`,
              top: `${gazePoint.y * 100}%`,
              width: '16px', height: '16px',
              borderRadius: '50%',
              border: '2px solid #4ae176',
              backgroundColor: 'rgba(74, 225, 118, 0.2)',
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.15s, top 0.15s',
              pointerEvents: 'none',
              boxShadow: '0 0 12px rgba(74, 225, 118, 0.4)',
            }} />
          )}
        </div>
      )}

      {/* Hidden video when preview is off */}
      {!showPreview && (
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      )}
    </div>
  );
}
