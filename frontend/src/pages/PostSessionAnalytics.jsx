import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function PostSessionAnalytics() {
  // Sample analytics data (would come from session data in production)
  const roundData = [
    { round: 'R1', health: 82, avgScore: 78, participants: 25 },
    { round: 'R2', health: 75, avgScore: 72, participants: 25 },
    { round: 'R3', health: 68, avgScore: 65, participants: 24 },
    { round: 'R4', health: 62, avgScore: 58, participants: 24 },
    { round: 'R5', health: 55, avgScore: 52, participants: 23 },
    { round: 'R6', health: 60, avgScore: 56, participants: 23 },
    { round: 'R7', health: 65, avgScore: 62, participants: 22 },
    { round: 'R8', health: 70, avgScore: 68, participants: 22 },
  ];

  const riskDistribution = [
    { name: 'On Track', value: 18, color: '#4ae176' },
    { name: 'At Risk', value: 5, color: '#ffb95f' },
    { name: 'High Risk', value: 2, color: '#ffb4ab' },
  ];

  const conceptData = [
    { concept: 'Recursion Base Case', missed: 8, total: 25 },
    { concept: 'Infinite Recursion', missed: 6, total: 25 },
    { concept: 'Binary Search', missed: 4, total: 25 },
    { concept: 'Queue FIFO', missed: 3, total: 24 },
    { concept: 'Closures', missed: 7, total: 23 },
    { concept: 'Memoization', missed: 5, total: 23 },
  ];

  const topStudents = [
    { name: 'Ananya S.', score: 95, risk: 'ON_TRACK', trend: '↑' },
    { name: 'Dev K.', score: 92, risk: 'ON_TRACK', trend: '↑' },
    { name: 'Sneha M.', score: 88, risk: 'ON_TRACK', trend: '→' },
    { name: 'Amit R.', score: 85, risk: 'ON_TRACK', trend: '↑' },
    { name: 'Vikram J.', score: 82, risk: 'ON_TRACK', trend: '→' },
  ];

  const atRiskStudents = [
    { name: 'Rahul P.', score: 35, risk: 'HIGH_RISK', trend: '↓', reason: 'Dropping 3 consecutive rounds' },
    { name: 'Priya D.', score: 42, risk: 'HIGH_RISK', trend: '↓', reason: 'Skipped last 2 questions' },
    { name: 'Karan S.', score: 48, risk: 'AT_RISK', trend: '↓', reason: 'Below class average by 20%' },
  ];

  const chartColors = {
    health: '#8083ff',
    avgScore: '#4ae176',
    line: '#c0c1ff',
    axis: '#908fa0',
    grid: 'rgba(70,69,84,0.15)',
    tooltip: '#1c2025',
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Post-Session Analytics</h1>
          <p className="subtitle">Recursion in Python • 8 Rounds • 25 Students • Completed</p>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-secondary">📥 Export Report</button>
          <button className="btn btn-primary">📤 Share Results</button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Final Health Score</div>
          <div className="stat-value text-primary">70%</div>
          <div className="stat-change" style={{ color: 'var(--secondary)' }}>↑ 8% from round 5</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Comprehension</div>
          <div className="stat-value text-secondary">68%</div>
          <div className="stat-change" style={{ color: 'var(--tertiary)' }}>↓ 10% from start</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value" style={{ color: 'var(--tertiary)' }}>88%</div>
          <div className="stat-change text-muted">22/25 completed all rounds</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Interventions</div>
          <div className="stat-value text-primary">4</div>
          <div className="stat-change text-muted">Across 8 rounds</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Health Trend */}
        <div className="card">
          <h3 className="title-lg mb-lg">Class Health Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={roundData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="round" stroke={chartColors.axis} fontSize={12} />
              <YAxis stroke={chartColors.axis} fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: 8, color: '#e0e2ea' }}
                itemStyle={{ color: '#e0e2ea' }}
              />
              <Line type="monotone" dataKey="health" stroke={chartColors.health} strokeWidth={3} dot={{ fill: chartColors.health, r: 4 }} name="Health Score" />
              <Line type="monotone" dataKey="avgScore" stroke={chartColors.avgScore} strokeWidth={2} dot={{ fill: chartColors.avgScore, r: 3 }} name="Avg Score" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <h3 className="title-lg mb-lg">Final Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {riskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: 8, color: '#e0e2ea' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-lg" style={{ marginTop: 8 }}>
            {riskDistribution.map((d, i) => (
              <div key={i} className="flex items-center gap-sm">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                <span className="label-sm" style={{ textTransform: 'none' }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Concepts & Students */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Most Missed Concepts */}
        <div className="card">
          <h3 className="title-lg mb-lg">Most Missed Concepts</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={conceptData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis type="number" stroke={chartColors.axis} fontSize={12} />
              <YAxis type="category" dataKey="concept" stroke={chartColors.axis} fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: chartColors.tooltip, border: 'none', borderRadius: 8, color: '#e0e2ea' }} />
              <Bar dataKey="missed" fill="var(--error)" radius={[0, 4, 4, 0]} name="Students Missed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Student Leaderboard */}
        <div className="card">
          <h3 className="title-lg mb-lg">Student Highlights</h3>
          
          <div className="label-md text-secondary mb-md">🏆 Top Performers</div>
          <div className="flex flex-col gap-sm" style={{ marginBottom: 20 }}>
            {topStudents.map((s, i) => (
              <div key={i} className="student-item" style={{ padding: '8px 12px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', width: 24 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.name}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--secondary)' }}>{s.score}%</span>
                <span style={{ color: 'var(--secondary)' }}>{s.trend}</span>
              </div>
            ))}
          </div>

          <div className="label-md text-error mb-md">⚠️ Needs Follow-Up</div>
          <div className="flex flex-col gap-sm">
            {atRiskStudents.map((s, i) => (
              <div key={i} className="student-item" style={{ padding: '8px 12px', background: 'rgba(255,107,107,0.05)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{s.name}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--error)' }}>{s.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Summary */}
      <div className="ai-panel" style={{ marginTop: 24 }}>
        <div className="ai-badge">🤖 AI Session Summary</div>
        <div style={{ marginTop: 16 }}>
          <p className="body-lg" style={{ lineHeight: 1.8 }}>
            The class struggled most with <strong className="text-tertiary">Recursion Base Case</strong> (8 students missed) and <strong className="text-tertiary">Closures</strong> (7 students missed).
            Health dropped to 55% by round 5 but recovered to 70% after AI-guided intervention.
            <strong className="text-error"> 2 students (Rahul, Priya)</strong> remain at HIGH RISK and should receive individual follow-up.
            Overall, the session showed a <strong className="text-secondary">positive recovery trend</strong> in later rounds.
          </p>
        </div>
      </div>
    </>
  );
}
