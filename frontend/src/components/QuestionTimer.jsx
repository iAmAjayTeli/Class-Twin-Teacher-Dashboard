import { useState, useEffect, useCallback } from 'react';

export default function QuestionTimer({ duration = 120, onComplete, isActive = true, label = "Next Round" }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / duration) * 100;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const isUrgent = timeLeft < 30;

  return (
    <div className="flex flex-col items-center gap-sm">
      <div className="label-md text-muted">{label}</div>
      <div className="timer-ring">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="var(--surface-highest)"
            strokeWidth="6"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={isUrgent ? 'var(--error)' : 'var(--primary-container)'}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="progress-ring-circle"
            style={{
              filter: isUrgent ? 'drop-shadow(0 0 6px rgba(255,107,107,0.5))' : 'drop-shadow(0 0 6px rgba(128,131,255,0.3))'
            }}
          />
        </svg>
        <span className="timer-text" style={{ color: isUrgent ? 'var(--error)' : 'var(--on-surface)' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
