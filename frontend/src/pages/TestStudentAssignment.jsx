import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function TestStudentAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  async function fetchAssignment() {
    try {
      const { data, error } = await supabase
        .from('remedial_assignments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssignment(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectOption = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let correctCount = 0;
    const finalResponses = questions.map(q => {
      const isCorrect = answers[q.id] === q.correct_option;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selected: answers[q.id],
        isCorrect
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    try {
      const { error } = await supabase
        .from('remedial_assignments')
        .update({
          status: 'completed',
          score,
          student_responses: finalResponses
        })
        .eq('id', id);

      if (error) throw error;
      setScoreResult(score);
    } catch (e) {
      alert('Failed to submit assignment');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Assignment...</div>;
  if (error || !assignment) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff7eb3' }}>Failed to load assignment. ({error})</div>;

  const questions = assignment.quiz_content?.questions || [];

  if (questions.length === 0) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb95f' }}>Assignment has no questions.</div>;
  }

  if (scoreResult !== null || assignment.status === 'completed') {
    const finalScore = scoreResult !== null ? scoreResult : assignment.score;
    return (
      <div style={{ height: '100vh', backgroundColor: '#0b0f19', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: '600px', backgroundColor: '#101419', borderRadius: '32px', padding: '48px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%', border: `6px solid ${finalScore >= 70 ? '#4ae176' : finalScore >= 40 ? '#ffb95f' : '#ff7eb3'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 900, color: finalScore >= 70 ? '#4ae176' : finalScore >= 40 ? '#ffb95f' : '#ff7eb3',
            margin: '0 auto 32px'
          }}>
            {finalScore}%
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>Assignment Completed!</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
            Great job pushing through the material! Your results have been securely recorded and sent to your teacher's dashboard.
          </p>
          <button onClick={() => window.close()} style={{ padding: '16px 32px', borderRadius: '24px', backgroundColor: '#4ae176', color: '#000', fontWeight: 700, fontSize: '16px', cursor: 'pointer', border: 'none' }}>
            Close Window
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;
  const isComplete = answers[currentQ?.id] !== undefined;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#8083ff' }}>school</span> 
            AI Remedial Practice
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--on-surface-variant)', fontSize: '14px' }}>Targeted improvements for {assignment.student_name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
          <div style={{ width: '160px', height: '6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', backgroundColor: '#4ae176' }} initial={{ width: 0 }} animate={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>
      </header>

      {/* Main Quiz Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', maxWidth: '800px' }}
          >
            {/* Question Text */}
            <div style={{ marginBottom: '40px' }}>
              <span style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '16px', backgroundColor: 'rgba(128, 131, 255, 0.1)', color: '#8083ff', fontWeight: 700, fontSize: '14px', marginBottom: '24px' }}>
                Question {currentQuestionIdx + 1}
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.4, margin: 0 }}>
                {currentQ.text}
              </h2>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === opt;
                const letter = String.fromCharCode(65 + i);
                
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '24px', borderRadius: '24px',
                      backgroundColor: isSelected ? 'rgba(74, 225, 118, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: `2px solid ${isSelected ? '#4ae176' : 'rgba(255,255,255,0.05)'}`,
                      cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '20px'
                    }}
                    onMouseOver={e => { if(!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                    onMouseOut={e => { if(!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                  >
                    <div style={{
                      minWidth: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isSelected ? '#4ae176' : 'rgba(255,255,255,0.05)', color: isSelected ? '#000' : 'white',
                      fontWeight: 800, fontSize: '18px'
                    }}>
                      {letter}
                    </div>
                    <span style={{ fontSize: '18px', color: isSelected ? '#4ae176' : 'white', fontWeight: 500, lineHeight: 1.5 }}>
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={handlePrev} 
          disabled={currentQuestionIdx === 0}
          style={{ padding: '16px 32px', borderRadius: '16px', background: 'transparent', color: currentQuestionIdx === 0 ? 'rgba(255,255,255,0.2)' : 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined">west</span> Previous
        </button>

        {currentQuestionIdx === questions.length - 1 ? (
          <button 
            onClick={handleSubmit} 
            disabled={answeredCount < questions.length || submitting}
            style={{ 
              padding: '16px 40px', borderRadius: '16px', 
              backgroundColor: answeredCount < questions.length ? 'rgba(74, 225, 118, 0.2)' : '#4ae176', 
              color: answeredCount < questions.length ? 'rgba(255,255,255,0.5)' : '#000', 
              border: 'none', cursor: answeredCount < questions.length ? 'not-allowed' : 'pointer', 
              fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: answeredCount === questions.length ? '0 12px 24px rgba(74, 225, 118, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Answers'}
            {!submitting && <span className="material-symbols-outlined">send</span>}
          </button>
        ) : (
          <button 
            onClick={handleNext} 
            disabled={!isComplete}
            style={{ padding: '16px 32px', borderRadius: '16px', backgroundColor: isComplete ? 'white' : 'rgba(255,255,255,0.1)', color: isComplete ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', cursor: isComplete ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Next <span className="material-symbols-outlined">east</span>
          </button>
        )}
      </footer>

    </div>
  );
}
