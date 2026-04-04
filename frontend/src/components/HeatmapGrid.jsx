export default function HeatmapGrid({ students = [], cols = 5 }) {
  const getRiskClass = (score) => {
    if (score >= 70) return 'on-track';
    if (score >= 40) return 'at-risk';
    return 'high-risk';
  };

  return (
    <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {students.map((student, i) => (
        <div
          key={student.id || i}
          className={`heatmap-cell ${getRiskClass(student.comprehension)}`}
          title={`${student.name}: ${student.comprehension}%`}
        >
          {student.comprehension}
        </div>
      ))}
    </div>
  );
}
