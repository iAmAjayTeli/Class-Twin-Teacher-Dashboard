/**
 * HeatmapGrid â€” Visual grid showing per-student comprehension scores.
 * Each cell is color-coded by risk level: green (>=70), yellow (>=40),
 * or red (<40). Grid columns auto-adjust based on the cols prop.
 *
 * @param {{ students: Array<{ id: string, name: string, comprehension: number }>, cols: number }} props
 */
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
