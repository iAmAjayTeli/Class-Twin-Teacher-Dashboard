// ClassTwin Risk Engine — Comprehension Scoring & Failure Prediction

const RISK_LEVELS = {
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  HIGH_RISK: 'HIGH_RISK'
};

function trendBonus(history) {
  if (history.length < 2) return 0.5;
  const delta = history[history.length - 1] - history[0];
  if (delta > 0) return 1;       // improving
  if (delta < -0.2) return 0;    // dropping fast
  return 0.5;                     // stable
}

function calcComprehension(student) {
  const streak = student.lastThreeCorrect || 0;  // 0 to 3
  const speed = student.avgResponseTime || 15;     // in seconds
  const trend = student.scoreHistory || [];

  const score =
    (streak / 3 * 50) +                                // accuracy = 50%
    (Math.max(0, 30 - speed) / 30 * 30) +             // speed = 30%
    (trendBonus(trend) * 20);                          // trend = 20%

  return Math.round(score);
}

function predictFailure(student, classAverage) {
  const history = student.scoreHistory || [];
  
  const dropping = history.length >= 2 && history.every(
    (v, i, a) => i === 0 || v <= a[i - 1]
  );
  const belowAvg = student.comprehension < classAverage - 15;
  const silent = student.skippedLast2;

  if (dropping && belowAvg) return RISK_LEVELS.HIGH_RISK;
  if (belowAvg || silent) return RISK_LEVELS.AT_RISK;
  return RISK_LEVELS.ON_TRACK;
}

function processRound(students) {
  // Calculate class average
  const scores = Object.values(students).map(s => s.comprehension || 0);
  const classAverage = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 50;

  // Update each student
  for (const id in students) {
    const student = students[id];
    student.comprehension = calcComprehension(student);
    student.risk = predictFailure(student, classAverage);
  }

  // Build heatmap
  const studentList = Object.values(students);
  const cols = Math.ceil(Math.sqrt(studentList.length));
  const heatmap = [];
  for (let i = 0; i < studentList.length; i += cols) {
    heatmap.push(studentList.slice(i, i + cols).map(s => s.comprehension));
  }

  // Count risk levels
  const onTrack = studentList.filter(s => s.risk === RISK_LEVELS.ON_TRACK).length;
  const atRisk = studentList.filter(s => s.risk === RISK_LEVELS.AT_RISK).length;
  const highRisk = studentList.filter(s => s.risk === RISK_LEVELS.HIGH_RISK).length;

  // Find most missed concept
  const conceptMisses = {};
  studentList.forEach(s => {
    if (s.lastMissedConcept) {
      conceptMisses[s.lastMissedConcept] = (conceptMisses[s.lastMissedConcept] || 0) + 1;
    }
  });
  const missedConcept = Object.entries(conceptMisses)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    classAverage: Math.round(classAverage),
    heatmap,
    onTrack,
    atRisk,
    highRisk,
    missedConcept,
    trend: classAverage > 60 ? 'stable' : 'declining'
  };
}

module.exports = { calcComprehension, predictFailure, processRound, RISK_LEVELS };
