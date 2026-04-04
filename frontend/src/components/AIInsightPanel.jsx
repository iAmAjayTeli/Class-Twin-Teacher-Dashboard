export default function AIInsightPanel({ insight }) {
  if (!insight) {
    return (
      <div className="ai-panel">
        <div className="ai-badge">🤖 AI Twin Engine</div>
        <p className="body-md text-muted" style={{ marginTop: 8 }}>
          AI insights will appear after round 2…
        </p>
      </div>
    );
  }

  return (
    <div className="ai-panel">
      <div className="ai-badge">🤖 AI Twin Engine — Live</div>

      <div style={{ marginTop: 16 }}>
        <div className="label-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 8 }}>
          Recommended Action
        </div>
        <p className="title-md" style={{ color: 'var(--primary)' }}>
          {insight.action}
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="label-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 8 }}>
          Concept to Revisit
        </div>
        <div className="badge badge-warning" style={{ fontSize: '0.875rem', padding: '6px 14px' }}>
          📖 {insight.revisit}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="label-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 8 }}>
          Class Health Score
        </div>
        <div className="flex items-center gap-md">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: insight.healthScore > 60 ? 'var(--secondary)' : 'var(--tertiary)' }}>
            {insight.healthScore}
          </div>
          <div className="health-bar" style={{ flex: 1 }}>
            <div className="health-bar-fill" style={{ width: `${insight.healthScore}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
