export default function StudentCard({ student }) {
  const riskColors = {
    ON_TRACK: { bg: 'rgba(74, 225, 118, 0.08)', border: 'rgba(74, 225, 118, 0.2)', color: '#4ae176', label: '🟢 On Track' },
    AT_RISK: { bg: 'rgba(255, 185, 95, 0.08)', border: 'rgba(255, 185, 95, 0.2)', color: '#ffb95f', label: '🟡 At Risk' },
    HIGH_RISK: { bg: 'rgba(255, 107, 107, 0.08)', border: 'rgba(255, 107, 107, 0.2)', color: '#ffb4ab', label: '🔴 High Risk' },
  };

  const risk = riskColors[student.risk] || riskColors.ON_TRACK;
  const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="student-item" style={{ background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 'var(--radius-lg)' }}>
      <div className="student-avatar" style={{ background: `linear-gradient(135deg, ${risk.color}44, ${risk.color}22)`, color: risk.color }}>
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{student.name}</div>
        <div style={{ fontSize: '0.75rem', color: risk.color }}>{risk.label}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: risk.color }}>
          {student.comprehension}%
        </div>
        <div style={{ fontSize: '0.625rem', color: 'var(--on-surface-variant)' }}>
          {student.totalCorrect || 0}/{student.totalAnswered || 0} correct
        </div>
      </div>
    </div>
  );
}
