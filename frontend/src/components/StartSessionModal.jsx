import { useState } from 'react';

export default function StartSessionModal({ isOpen, onClose, onCreate }) {
  const [topic, setTopic] = useState('');
  const [totalRounds, setTotalRounds] = useState(8);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ topic: topic || 'General', totalRounds });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="headline-md" style={{ marginBottom: 8 }}>Start New Session</h2>
        <p className="body-md text-muted" style={{ marginBottom: 32 }}>
          Create a live classroom session. Students will join via QR code.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label className="label-md text-muted" style={{ display: 'block', marginBottom: 8 }}>
              Topic / Subject
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g., Recursion in Python"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label className="label-md text-muted" style={{ display: 'block', marginBottom: 8 }}>
              Number of Rounds
            </label>
            <div className="flex gap-sm">
              {[4, 6, 8, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`btn ${totalRounds === n ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setTotalRounds(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-md">
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 2 }}>
              {loading ? '⏳ Creating...' : '🚀 Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
