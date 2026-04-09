import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import Sidebar from '../components/Sidebar';

// Custom CSS added via inline styles for specific elements
const glassStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #EAECF0',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

// -- DUMMY DATA FOR THE DASHBOARD --
const COLORS = ['#4ae176', '#8083ff', '#ffb95f', '#ff5f81', '#1fc7a1'];

const attendanceData = [
  { day: 'Mon', present: 110, absent: 10 },
  { day: 'Tue', present: 105, absent: 15 },
  { day: 'Wed', present: 112, absent: 8 },
  { day: 'Thu', present: 98, absent: 22 },
  { day: 'Fri', present: 115, absent: 5 },
];

const subjectMarks = [
  { subject: 'Math', avg: 76, highest: 98 },
  { subject: 'Physics', avg: 68, highest: 95 },
  { subject: 'Chemistry', avg: 72, highest: 92 },
  { subject: 'CompSci', avg: 85, highest: 99 },
  { subject: 'English', avg: 82, highest: 96 }
];

const behaviorRadar = [
  { metric: 'Participation', classAvg: 75, topStudent: 95 },
  { metric: 'Discipline', classAvg: 85, topStudent: 98 },
  { metric: 'Focus', classAvg: 70, topStudent: 92 },
  { metric: 'Teamwork', classAvg: 80, topStudent: 100 },
  { metric: 'Initiative', classAvg: 65, topStudent: 90 }
];

const riskLevels = [
  { name: 'Low Risk', value: 85 },
  { name: 'Medium Risk', value: 25 },
  { name: 'High Risk', value: 10 }
];

const assignmentStatus = [
  { name: 'Submitted', value: 90 },
  { name: 'Pending', value: 20 },
  { name: 'Late', value: 10 }
];

const testPerformance = [
  { exam: 'Term 1', marks: 65, classAvg: 60 },
  { exam: 'Mid-term', marks: 72, classAvg: 68 },
  { exam: 'Term 2', marks: 78, classAvg: 70 },
  { exam: 'Finals', marks: 84, classAvg: 75 }
];

export default function PostSessionAnalytics() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('snapshot');
  
  // Real Data States
  const [realStats, setRealStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'snapshot', label: 'Snapshot & Alerts' },
    { id: 'attendance', label: 'Attendance & Behavior' },
    { id: 'academics', label: 'Academics & Exams' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const res = await fetch(`${baseUrl}/api/dashboard/stats`, { headers });
      if (res.ok) {
        setRealStats(await res.json());
      }
    } catch (err) {
      console.error('Error fetching real stats:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Derive top KPIs from real data if available
  const totalRealSessions = realStats.length;
  let totalLogs = 0;
  let avgConfidence = 0;
  if (totalRealSessions > 0) {
    const totalConf = realStats.reduce((acc, session) => acc + (session.overall_confidence || 0), 0);
    avgConfidence = Math.round(totalConf / totalRealSessions);
    totalLogs = realStats.reduce((acc, session) => acc + (session.engagement_logs?.[0]?.count || 0), 0);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: '#F5F6FA', color: '#111827', fontFamily: "'Inter', sans-serif", paddingBottom: '96px' }}>
      {/* Top NavBar */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EAECF0',
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 32px', height: '64px',
      }}>
        <div className="font-headline" style={{ fontSize: '20px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Analytics Hub</div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/sessions'); }} style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>Sessions</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/students'); }} style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>Students</a>
          <a href="#" style={{ color: '#1A5C3B', fontSize: '14px', fontWeight: 600, borderBottom: '2px solid #1A5C3B', paddingBottom: '2px' }}>Analytics</a>
        </nav>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><span className="material-symbols-outlined">notifications</span></button>
      </header>

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 32px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Header Area */}
        <div>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1A5C3B', fontWeight: 700, marginBottom: '8px' }}>Advanced Analytics Hub</p>
          <h1 className="font-headline" style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' }}>Classroom Intelligence</h1>
        </div>

        {/* Dynamic Tab Navigation */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #EAECF0' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: 600,
                color: activeTab === tab.id ? '#1A5C3B' : '#9CA3AF',
                borderBottom: activeTab === tab.id ? '3px solid #1A5C3B' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* TAB 1: SNAPSHOT & ALERTS */}
            {activeTab === 'snapshot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 4 KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                  {[ 
                    { title: 'Total Sessions Run', value: isLoading ? '--' : totalRealSessions, trend: 'Across all subjects', icon: 'groups', color: 'var(--primary)' },
                    { title: 'Student Engagements', value: isLoading ? '--' : totalLogs, trend: '+4% from last month', icon: 'fact_check', color: 'var(--secondary)' },
                    { title: 'Avg Cognitive Sync', value: isLoading ? '--' : `${avgConfidence}%`, trend: '-2% from last term', icon: 'psychology', color: 'var(--tertiary)' },
                    { title: 'Pending Tasks', value: '24', trend: 'Needs review today', icon: 'assignment_late', color: 'var(--error)' }
                  ].map((kpi, i) => (
                    <div key={i} style={{ ...glassStyle, padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '32px' }}>{kpi.icon}</span>
                      </div>
                      <h3 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>{kpi.value}</h3>
                      <p style={{ fontSize: '14px', color: 'rgba(224, 226, 234, 0.6)' }}>{kpi.title}</p>
                      <p style={{ fontSize: '12px', color: kpi.color, marginTop: '8px', fontWeight: 600 }}>{kpi.trend}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Risk Area Chart */}
                  <div style={glassStyle}>
                    <h3 className="font-headline" style={{ fontSize: '20px', marginBottom: '24px' }}>Risk Level Distribution</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={riskLevels} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                            {riskLevels.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderRadius: '8px', color: '#111827' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI Oracle Component */}
                  <div style={{ ...glassStyle, borderTop: '3px solid #1A5C3B', position: 'relative', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#1A5C3B' }}>auto_awesome</span>
                      <h3 className="font-headline" style={{ fontSize: '20px' }}>AI Predictive Analytics</h3>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '24px' }}>
                      Based on current engagement trends and homework submission rates, the AI predicts a <strong style={{ color: 'var(--secondary)' }}>4% drop in mid-term scores</strong> for the Physics cohort. Immediate intervention suggested for the bottom 15% of students.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button
                        onClick={() => navigate('/students')}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E8F5EE'; e.currentTarget.style.borderColor = '#1A5C3B'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#EAECF0'; }}
                        style={{ padding: '12px 24px', backgroundColor: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: '12px', color: '#1A5C3B', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter,sans-serif', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
                        Review At-Risk Students
                      </button>
                      <button
                        onClick={() => navigate('/ai-tutor', { state: { autoPrompt: 'Generate a detailed remedial plan for the bottom 15% of students in the Physics cohort who are predicted to see a 4% drop in mid-term scores. Include specific intervention strategies, timeline, and personalized study recommendations.' } })}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,92,59,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#1A5C3B,#2D7A52)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter,sans-serif', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_fix_high</span>
                        Generate Remedial Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE & BEHAVIOR */}
            {activeTab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={glassStyle}>
                  <h3 className="font-headline" style={{ fontSize: '20px', marginBottom: '24px' }}>Weekly Attendance Trend</h3>
                  <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="day" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderRadius: '8px', color: '#111827' }} />
                        <Legend />
                        <Bar dataKey="present" fill="#4ae176" name="Present" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="absent" stroke="#ff5f81" name="Absent" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={glassStyle}>
                  <h3 className="font-headline" style={{ fontSize: '20px', marginBottom: '24px' }}>Behavioral Radar</h3>
                  <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={behaviorRadar}>
                        <PolarGrid stroke="#F3F4F6" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                        <Radar name="Class Average" dataKey="classAvg" stroke="#8083ff" fill="#8083ff" fillOpacity={0.4} />
                        <Radar name="Top Student" dataKey="topStudent" stroke="#4ae176" fill="#4ae176" fillOpacity={0.2} />
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderRadius: '8px', color: '#111827' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                </div>

                {/* Real Attendees of Latest Session */}
                <div style={glassStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 className="font-headline" style={{ fontSize: '20px' }}>Latest Session Attendees</h3>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A5C3B', backgroundColor: '#E8F5EE', padding: '6px 16px', borderRadius: '20px' }}>
                      {realStats.length > 0 && realStats[0].session_students ? realStats[0].session_students.length : 0} student(s) joined
                    </span>
                  </div>
                  {realStats.length > 0 && realStats[0].session_students?.length > 0 ? (
                    <div style={{ border: '1px solid #EAECF0', borderRadius: '12px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #EAECF0' }}>
                          <tr>
                            <th style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Student Name</th>
                            <th style={{ padding: '16px 20px', fontSize: '13px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Join Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realStats[0].session_students.map((student, i) => (
                            <tr key={i} style={{ borderBottom: i !== realStats[0].session_students.length - 1 ? '1px solid #EAECF0' : 'none', backgroundColor: '#fff' }}>
                              <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                                    {student.student_name ? student.student_name.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  {student.student_name || 'Unknown'}
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6B7280' }}>
                                {student.joined_at ? new Date(student.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#9CA3AF', marginBottom: '12px' }}>group_off</span>
                      <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>No students recorded for the most recent session.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ACADEMICS & EXAMS */}
            {activeTab === 'academics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={glassStyle}>
                  <h3 className="font-headline" style={{ fontSize: '20px', marginBottom: '24px' }}>Test Performance Evolution</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={testPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="exam" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderRadius: '8px', color: '#111827' }} />
                        <Legend />
                        <Area type="monotone" dataKey="classAvg" stroke="#8083ff" fill="#8083ff" fillOpacity={0.1} name="Class Average" />
                        <Area type="monotone" dataKey="marks" stroke="#4ae176" fill="#4ae176" fillOpacity={0.3} name="Top 10% Avg" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  <div style={glassStyle}>
                    <h3 className="font-headline" style={{ fontSize: '20px', marginBottom: '24px' }}>Subject-wise Averages</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectMarks}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="subject" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderRadius: '8px', color: '#111827' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                          <Legend />
                          <Bar dataKey="avg" fill="#8083ff" name="Class Average" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="highest" fill="#ffb95f" name="Highest Score" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={glassStyle}>
                    <h3 className="font-headline" style={{ fontSize: '20px', marginBottom: '24px' }}>Assignment Status</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={assignmentStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                            {assignmentStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EAECF0', borderRadius: '8px', color: '#111827' }} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      </div>
    </div>
  );
}
