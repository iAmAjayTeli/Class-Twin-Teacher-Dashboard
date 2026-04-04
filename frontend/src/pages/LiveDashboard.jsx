import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HeatmapGrid from '../components/HeatmapGrid';
import StudentCard from '../components/StudentCard';
import AIInsightPanel from '../components/AIInsightPanel';
import QuestionTimer from '../components/QuestionTimer';
import { useSocket } from '../hooks/useSocket';

export default function LiveDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const { connected, twinData, aiInsight, currentRound, students, sessionEnded, nextRound, endSession } = useSocket();

  const [session, setSession] = useState(null);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (code) {
      fetch(`http://localhost:3001/api/sessions/${code}`)
        .then(r => r.json())
        .then(setSession)
        .catch(() => {});
    }
  }, [code]);

  const handleNextRound = useCallback(async () => {
    if (!code) return;
    setTimerActive(false);
    await nextRound(code);
    setTimerActive(true);
  }, [code, nextRound]);

  const handleEndSession = async () => {
    if (!code) return;
    await endSession(code);
    navigate('/analytics');
  };

  if (sessionEnded) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <h2 className="headline-lg" style={{ marginBottom: 8 }}>Session Complete!</h2>
        <p className="body-lg text-muted mb-lg">Great job! View the analytics for this session.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/analytics')}>
          📊 View Analytics
        </button>
      </div>
    );
  }

  const classHealth = twinData?.classHealth || session?.classHealth || 0;
  const roundNum = twinData?.round || currentRound?.round || session?.currentRound || 1;
  const totalRounds = twinData?.totalRounds || currentRound?.totalRounds || session?.totalRounds || 8;
  const onTrack = twinData?.onTrack || 0;
  const atRisk = twinData?.atRisk || 0;
  const highRisk = twinData?.highRisk || 0;

  const highRiskStudents = students.filter(s => s.risk === 'HIGH_RISK');
  const atRiskStudents = students.filter(s => s.risk === 'AT_RISK');

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-sm">
            <h1>Live Dashboard</h1>
            <span className="badge badge-success">● Live</span>
          </div>
          <p className="subtitle">
            {session?.topic || 'Session'} • Round {roundNum}/{totalRounds} • {students.length} students
          </p>
        </div>
        <div className="flex gap-md items-center">
          <QuestionTimer duration={120} isActive={timerActive} onComplete={handleNextRound} label="Next Round" />
          <div className="flex flex-col gap-sm">
            <button className="btn btn-primary" onClick={handleNextRound}>⏭ Next Round</button>
            <button className="btn btn-danger btn-sm" onClick={handleEndSession}>End Session</button>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Class Health</div>
          <div className="stat-value" style={{ color: classHealth > 60 ? 'var(--secondary)' : classHealth > 40 ? 'var(--tertiary)' : 'var(--error)' }}>
            {classHealth}%
          </div>
          <div className="health-bar" style={{ marginTop: 4 }}>
            <div className="health-bar-fill" style={{ width: `${classHealth}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">On Track</div>
          <div className="stat-value text-secondary">{onTrack}</div>
          <div className="stat-change" style={{ color: 'var(--secondary)' }}>🟢 students</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">At Risk</div>
          <div className="stat-value text-tertiary">{atRisk}</div>
          <div className="stat-change" style={{ color: 'var(--tertiary)' }}>🟡 need attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Risk</div>
          <div className="stat-value text-error">{highRisk}</div>
          <div className="stat-change" style={{ color: 'var(--error)' }}>🔴 intervene now</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Left Column */}
        <div className="flex flex-col gap-lg">
          {/* AI Insight Panel */}
          <AIInsightPanel insight={aiInsight} />

          {/* Heatmap */}
          <div className="card">
            <div className="flex items-center justify-between mb-md">
              <h3 className="title-lg">Comprehension Heatmap</h3>
              <span className="label-md text-muted">{students.length} students</span>
            </div>
            {students.length > 0 ? (
              <HeatmapGrid students={students} cols={Math.min(8, Math.ceil(Math.sqrt(students.length * 2)))} />
            ) : (
              <p className="body-md text-muted" style={{ textAlign: 'center', padding: 32 }}>
                Waiting for student answers...
              </p>
            )}
          </div>
        </div>

        {/* Right Column — Student List */}
        <div className="flex flex-col gap-md">
          {/* High Risk */}
          {highRiskStudents.length > 0 && (
            <div>
              <h3 className="title-md mb-md" style={{ color: 'var(--error)' }}>
                🔴 High Risk ({highRiskStudents.length})
              </h3>
              <div className="flex flex-col gap-sm">
                {highRiskStudents.map(s => <StudentCard key={s.id} student={s} />)}
              </div>
            </div>
          )}

          {/* At Risk */}
          {atRiskStudents.length > 0 && (
            <div>
              <h3 className="title-md mb-md" style={{ color: 'var(--tertiary)' }}>
                🟡 At Risk ({atRiskStudents.length})
              </h3>
              <div className="flex flex-col gap-sm">
                {atRiskStudents.map(s => <StudentCard key={s.id} student={s} />)}
              </div>
            </div>
          )}

          {/* All Students */}
          <div>
            <h3 className="title-md mb-md">All Students ({students.length})</h3>
            <div className="flex flex-col gap-sm" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {students.length > 0 ? (
                students
                  .sort((a, b) => (a.comprehension || 0) - (b.comprehension || 0))
                  .map(s => <StudentCard key={s.id} student={s} />)
              ) : (
                <p className="body-md text-muted text-center" style={{ padding: 24 }}>
                  No students connected yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
        <div className="badge" style={{ background: connected ? 'rgba(74,225,118,0.15)' : 'rgba(255,107,107,0.15)', color: connected ? 'var(--secondary)' : 'var(--error)', padding: '6px 14px' }}>
          {connected ? '🟢 Connected' : '🔴 Reconnecting...'}
        </div>
      </div>
    </>
  );
}
