import React, { useState, useEffect } from 'react';
import store from '../data/store';
import { getApiBaseUrl } from '../data/config.js';

const ExamInterface = ({ user, topic, onComplete, onExit }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examFinished, setExamFinished] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Load from store (merges static questionBank with localStorage)
    const data = store.getQuestions(topic);
    
    // Use correctOption directly as it's already 'A', 'B', 'C', or 'D' in the local questionBank
    const mappedData = data.map(q => ({
      ...q,
      correctOption: q.correctOption
    }));
    
    setQuestions(mappedData);
    setLoading(false);

    // Track active exam session for admin dashboard
    if (user && user.role === 'STUDENT') {
      localStorage.setItem('active_exam_user_' + user.id, topic);
    }

    return () => {
      if (user && user.role === 'STUDENT') {
        localStorage.removeItem('active_exam_user_' + user.id);
      }
    };
  }, [topic, user]);

  const allAnswered = questions.length > 0 && Object.keys(submitted).length === questions.length;

  const handleSubmit = async () => {
    if (!selectedOption) return;
    const q = questions[currentIndex];
    const isCorrect = q.correctOption === selectedOption;

    setFeedback({ correct: isCorrect, message: isCorrect ? '✅ Correct!' : `❌ Wrong! Answer: ${q.correctOption}` });
    setSubmitted(prev => ({ ...prev, [currentIndex]: selectedOption }));
    if (isCorrect) setScore(prev => prev + 1);

    // Persist submission to backend database for global leaderboard
    try {
      await fetch(getApiBaseUrl() + '/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          questionId: q.id || currentIndex,
          selectedOption: selectedOption
        })
      });
    } catch (err) {
      console.warn('Backend unreachable. Handled via localStorage offline fallback.');
    }

    // Auto-move to next unanswered question after 1.2 seconds (but don't finish exam)
    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      // Find next unanswered question
      const answeredCount = Object.keys(submitted).length + 1; // +1 for current
      if (answeredCount < questions.length) {
        // Move to next unanswered
        let next = currentIndex + 1;
        while (next < questions.length && submitted[next] !== undefined) next++;
        if (next >= questions.length) {
          // Wrap around to find first unanswered
          next = 0;
          while (next < questions.length && (submitted[next] !== undefined || next === currentIndex)) next++;
        }
        if (next < questions.length) setCurrentIndex(next);
      }
      // If all answered, stay on current — user will see the Finish button
    }, q.logic ? 4000 : 1200);
  };

  const handleFinish = () => {
    setShowConfirm(true);
  };

  const confirmFinish = () => {
    const finalScore = score;

    // Save per-question results so ResultScreen can display the correct score
    const examResultData = questions.map((q, i) => ({
      questionId: q.id || i,
      questionText: q.questionText,
      selected: submitted[i] || null,
      correct: q.correctOption,
      isCorrect: submitted[i] === q.correctOption,
    }));
    localStorage.setItem('examResults_' + user.id, JSON.stringify(examResultData));
    localStorage.setItem('lastExamScore_' + user.id, JSON.stringify({
      score: finalScore,
      total: questions.length,
      topic: topic || 'Exam',
    }));

    // Save final score to leaderboard with topic-specific granularity
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    let userEntry = leaderboard.find(s => s.id === user.id);
    
    if (!userEntry) {
      userEntry = { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        score: finalScore,
        topicScores: { [topic]: finalScore }
      };
      leaderboard.push(userEntry);
    } else {
      // Initialize topicScores if it doesn't exist (migration for existing users)
      if (!userEntry.topicScores) userEntry.topicScores = {};
      
      // Update this topic's best score
      userEntry.topicScores[topic] = Math.max(userEntry.topicScores[topic] || 0, finalScore);
      
      // Calculate overall score as sum of best scores of each topic
      userEntry.score = Object.values(userEntry.topicScores).reduce((sum, val) => sum + val, 0);
    }
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    setShowConfirm(false);
    setExamFinished(true);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedback(null);
      setSelectedOption(submitted[currentIndex - 1] || null);
    }
  };

  const handleExit = () => {
    onExit();
  };

  // ── Confirmation Screen ──
  if (showConfirm) {
    const unanswered = questions.length - Object.keys(submitted).length;
    return (
      <div style={{
        minHeight: '100vh', background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: '#1e293b', borderRadius: '20px', padding: '48px 40px',
          maxWidth: '480px', width: '90%', textAlign: 'center',
          border: '1px solid #334155', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📋</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#e2e8f0', marginBottom: '12px' }}>
            Finish the Exam?
          </h2>

          {unanswered > 0 ? (
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: '12px', padding: '14px 18px', marginBottom: '24px'
            }}>
              <p style={{ color: '#eab308', fontSize: '15px', fontWeight: '600', margin: 0 }}>
                ⚠️ You have {unanswered} unanswered {unanswered === 1 ? 'question' : 'questions'}.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px', marginBottom: 0 }}>
                Unanswered questions will be marked as incorrect.
              </p>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '24px' }}>
              You have answered all {questions.length} questions. Ready to submit?
            </p>
          )}

          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
            Your score: <strong style={{ color: '#818cf8' }}>{score} / {questions.length}</strong>
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                border: '1px solid #475569', background: 'transparent',
                color: '#94a3b8', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = '#334155'; e.target.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}
            >
              ← Go Back
            </button>
            <button
              onClick={confirmFinish}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                color: '#fff', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(34,197,94,0.3)'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              ✅ Yes, Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Finished Screen: Score + Leaderboard ──
  if (examFinished) {
    const scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    scores.sort((a, b) => b.score - a.score);
    const myRank = scores.findIndex(s => String(s.id) === String(user.id)) + 1;
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>

          {/* Score Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '48px 40px',
            textAlign: 'center', border: '1px solid #334155', marginBottom: '32px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.06)' }} />

            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎯</div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Exam Complete!</h1>
            <div style={{ fontSize: '64px', fontWeight: '900', marginBottom: '4px', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {score} / {questions.length}
            </div>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '20px' }}>Questions Answered Correctly</p>

            {/* Accuracy Bar */}
            <div style={{ width: '80%', margin: '0 auto', height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${percentage}%`, height: '100%', borderRadius: '5px',
                background: percentage >= 70 ? 'linear-gradient(90deg, #22c55e, #10b981)' : percentage >= 40 ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                transition: 'width 1s ease-out'
              }} />
            </div>
            <p style={{ marginTop: '10px', fontSize: '18px', fontWeight: '700', color: percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#f59e0b' : '#ef4444' }}>
              {percentage}% Accuracy — {percentage >= 70 ? '🌟 Excellent!' : percentage >= 40 ? '👍 Good Effort!' : '📚 Keep Practicing!'}
            </p>

            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '24px' }}>
              <div><div style={{ fontSize: '28px', fontWeight: '800', color: '#22c55e' }}>{score}</div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Correct</div></div>
              <div><div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{questions.length - score}</div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Wrong</div></div>
              <div><div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>#{myRank}</div><div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Your Rank</div></div>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '28px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 Leaderboard
            </h2>
            {scores.length === 0 && <p style={{ color: '#64748b', textAlign: 'center' }}>No scores yet.</p>}
            {scores.slice(0, 10).map((entry, i) => (
              <div key={entry.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', borderRadius: '12px', marginBottom: '8px',
                background: String(entry.id) === String(user.id) ? 'rgba(99, 102, 241, 0.15)' : '#0f172a',
                border: String(entry.id) === String(user.id) ? '2px solid #6366f155' : '1px solid #1e293b',
                transform: String(entry.id) === String(user.id) ? 'scale(1.02)' : 'none',
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '800', width: '36px', textAlign: 'center',
                    color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#64748b'
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div>
                    <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '15px' }}>{entry.name || `Student ${entry.id}`}</span>
                    {String(entry.id) === String(user.id) && (
                      <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 10px', borderRadius: '10px', background: '#6366f1', color: '#fff', fontWeight: '600' }}>YOU</span>
                    )}
                  </div>
                </div>
                <span style={{ fontWeight: '800', fontSize: '20px', color: '#818cf8' }}>{entry.score}</span>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button onClick={onComplete}
              style={{
                padding: '14px 40px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              ← Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ fontSize: '20px', color: '#94a3b8' }}>Loading questions...</div>
      </div>
    );
  }

  const q = questions[currentIndex];
  if (!q) return null;

  const options = [
    { key: 'A', text: q.optionA },
    { key: 'B', text: q.optionB },
    { key: 'C', text: q.optionC },
    { key: 'D', text: q.optionD },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex' }}>
      
      {/* Sidebar: Question Navigation */}
      <div style={{ width: '280px', background: '#1e293b', padding: '24px 20px', borderRight: '1px solid #334155', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>{topic} Exam</h3>
        <p style={{ fontSize: '13px', color: '#818cf8', marginBottom: '16px', fontWeight: '600' }}>Current Score: {score}/{questions.length}</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          maxHeight: '60vh',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => { setCurrentIndex(i); setSelectedOption(submitted[i] || null); setFeedback(null); }}
              style={{
                width: '100%', aspectRatio: '1/1', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px',
                cursor: 'pointer',
                background: i === currentIndex ? '#6366f1' : submitted[i] !== undefined ? '#22c55e' : '#334155',
                color: '#fff', transition: 'all 0.2s',
                boxShadow: i === currentIndex ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >{i + 1}</button>
          ))}
        </div>
        <div style={{ marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#22c55e', display: 'inline-block' }} /> Answered</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#6366f1', display: 'inline-block' }} /> Current</div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={handleFinish}
            style={{
              padding: '14px', borderRadius: '12px', border: 'none',
              background: allAnswered ? 'linear-gradient(135deg, #22c55e, #10b981)' : '#334155', 
              color: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s',
              boxShadow: allAnswered ? '0 4px 12px rgba(34,197,94,0.3)' : 'none'
            }}
          >
            {allAnswered ? '✅ Finish Exam' : '🏁 Finish Early'}
          </button>
          
          <button onClick={handleExit}
            style={{
              padding: '12px', borderRadius: '10px', border: '1px solid #475569',
              background: 'transparent', color: '#94a3b8', fontSize: '13px', 
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            🚪 Exit Exam
          </button>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { transform: scale(1.03); box-shadow: 0 0 20px 4px rgba(34,197,94,0.25); } }`}</style>
      </div>

      {/* Main Exam Area */}
      <div style={{ flex: 1, padding: '40px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Progress Bar */}
        <div style={{ width: '100%', maxWidth: '700px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Object.keys(submitted).length} / {questions.length} Answered</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${((Object.keys(submitted).length) / questions.length) * 100}%`, height: '100%', background: allAnswered ? 'linear-gradient(90deg, #22c55e, #10b981)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)', transition: 'width 0.3s' }} />
          </div>
          {allAnswered && (
            <p style={{ textAlign: 'center', marginTop: '10px', color: '#22c55e', fontWeight: '700', fontSize: '15px', animation: 'pulse 1.5s infinite' }}>
              🎉 All questions answered! Click "Finish Exam" in the sidebar to see your results.
            </p>
          )}
        </div>

        {/* Question Card */}
        <div style={{ width: '100%', maxWidth: '700px', background: '#1e293b', borderRadius: '16px', padding: '36px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', lineHeight: '1.6', marginBottom: '28px', color: '#e2e8f0' }}>
            <span style={{ color: '#818cf8', marginRight: '8px' }}>Q{currentIndex + 1}.</span>
            {q.questionText}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {options.map(opt => (
              <button key={opt.key}
                onClick={() => { if (!feedback && submitted[currentIndex] === undefined) setSelectedOption(opt.key); }}
                style={{
                  padding: '16px 20px', borderRadius: '12px', textAlign: 'left', fontSize: '16px',
                  border: selectedOption === opt.key ? '2px solid #6366f1' : '2px solid #334155',
                  background: feedback
                    ? opt.key === q.correctOption ? 'rgba(34, 197, 94, 0.15)' : selectedOption === opt.key ? 'rgba(239, 68, 68, 0.15)' : '#0f172a'
                    : selectedOption === opt.key ? 'rgba(99, 102, 241, 0.1)' : '#0f172a',
                  color: '#e2e8f0', transition: 'all 0.2s', cursor: feedback || submitted[currentIndex] !== undefined ? 'default' : 'pointer'
                }}
              >
                <span style={{ fontWeight: '700', marginRight: '12px', color: '#818cf8' }}>{opt.key}.</span>
                {opt.text}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', textAlign: 'center', fontWeight: '600',
              background: feedback.correct ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: feedback.correct ? '#22c55e' : '#ef4444',
              border: `1px solid ${feedback.correct ? '#22c55e33' : '#ef444433'}`
            }}>
              {feedback.message}
              {q.logic && <div style={{ marginTop: '10px', fontSize: '14px', color: '#e2e8f0', fontWeight: '400', textAlign: 'left', fontStyle: 'italic', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>💡 Logic: {q.logic}</div>}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={handlePrevious} disabled={currentIndex === 0}
              style={{
                flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #475569',
                background: 'rgba(30, 41, 59, 0.5)', color: currentIndex === 0 ? '#475569' : '#e2e8f0',
                fontSize: '16px', fontWeight: '600', transition: 'all 0.2s',
                cursor: currentIndex === 0 ? 'default' : 'pointer',
                opacity: currentIndex === 0 ? 0.5 : 1
              }}
            >
              ← Previous
            </button>

            {!feedback && submitted[currentIndex] === undefined ? (
              <button onClick={handleSubmit} disabled={!selectedOption}
                style={{
                  flex: 2, padding: '16px', borderRadius: '12px', border: 'none',
                  background: selectedOption ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#334155',
                  color: '#fff', fontSize: '16px', fontWeight: '700', transition: 'all 0.2s',
                  opacity: selectedOption ? 1 : 0.5, cursor: selectedOption ? 'pointer' : 'default'
                }}
              >
                Submit & Next →
              </button>
            ) : (
              <button onClick={() => {
                  let next = currentIndex + 1;
                  if (next < questions.length) {
                    setCurrentIndex(next);
                    setSelectedOption(submitted[next] || null);
                    setFeedback(null);
                  }
                }}
                disabled={currentIndex === questions.length - 1}
                style={{
                  flex: 2, padding: '16px', borderRadius: '12px', border: 'none',
                  background: currentIndex === questions.length - 1 ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: '16px', fontWeight: '700', transition: 'all 0.2s',
                  cursor: currentIndex === questions.length - 1 ? 'default' : 'pointer',
                  opacity: currentIndex === questions.length - 1 ? 0.5 : 1
                }}
              >
                Next Question →
              </button>
            )}
          </div>

          {/* Already answered indicator */}
          {submitted[currentIndex] !== undefined && !feedback && (
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              ✅ Already answered this question
            </div>
          )}
        </div>

        {/* Finish Exam button also in main area when all answered */}
        {allAnswered && (
          <button onClick={handleFinish}
            style={{
              marginTop: '28px', padding: '18px 60px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#fff',
              fontSize: '18px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)', animation: 'pulse 1.5s infinite'
            }}
          >
            🏁 Finish Exam & View Results
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamInterface;
