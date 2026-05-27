import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../data/config.js';

const ResultScreen = ({ user, onBack, onLogout }) => {
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab, setTab] = useState('score');

  useEffect(() => {
    // Read user's own current exam results from localStorage
    const examResults = JSON.parse(localStorage.getItem('examResults_' + user.id) || '[]');
    const correct = examResults.filter(r => r.isCorrect).length;
    setResults({ totalQuestions: examResults.length, correctAnswers: correct, score: correct });

    // Fetch Global Leaderboard
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(getApiBaseUrl() + '/api/admin/leaderboard');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Map backend studentId to id
        const formattedData = data.map(item => ({ ...item, id: item.studentId }));
        
        const localLb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        const mergedMap = new Map();
        
        localLb.forEach(item => {
          const key = item.email ? item.email.toLowerCase() : String(item.id);
          mergedMap.set(key, item);
        });
        
        formattedData.forEach(item => {
          const key = item.email ? item.email.toLowerCase() : String(item.id);
          const existing = mergedMap.get(key);
          if (existing) {
            mergedMap.set(key, {
              ...existing,
              ...item,
              score: Math.max(existing.score, item.score)
            });
          } else {
            mergedMap.set(key, item);
          }
        });
        
        const sorted = Array.from(mergedMap.values()).sort((a, b) => b.score - a.score);
        setLeaderboard(sorted);
      } catch (err) {
        console.warn('Backend leaderboard unreachable. Falling back to local storage.');
        const scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        scores.sort((a, b) => b.score - a.score);
        setLeaderboard(scores);
      }
    };

    fetchLeaderboard();
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8' }}>← Back to Topics</button>
          <button onClick={onLogout} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8' }}>Logout</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
          <button onClick={() => setTab('score')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: tab === 'score' ? '#6366f1' : '#1e293b', color: '#fff', fontWeight: '600' }}>My Score</button>
          <button onClick={() => setTab('leaderboard')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: tab === 'leaderboard' ? '#6366f1' : '#1e293b', color: '#fff', fontWeight: '600' }}>🏆 Leaderboard</button>
        </div>

        {/* Score Tab */}
        {tab === 'score' && results && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #334155' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {results.correctAnswers} / {results.totalQuestions}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>Questions Answered Correctly</p>
            <div style={{ marginTop: '24px', width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${results.totalQuestions > 0 ? (results.correctAnswers / results.totalQuestions) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #10b981)', borderRadius: '4px' }} />
            </div>
            <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
              {results.totalQuestions > 0 ? Math.round((results.correctAnswers / results.totalQuestions) * 100) : 0}% Accuracy
            </p>
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#e2e8f0' }}>🏆 Top 10 Leaderboard</h2>
            {leaderboard.length === 0 && <p style={{ color: '#64748b', textAlign: 'center' }}>No scores yet.</p>}
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', borderRadius: '10px', marginBottom: '8px',
                background: String(entry.id) === String(user.id) ? 'rgba(99, 102, 241, 0.15)' : '#0f172a',
                border: String(entry.id) === String(user.id) ? '1px solid #6366f133' : '1px solid transparent'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#64748b', width: '30px' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{entry.name || `Student ${entry.id}`}</span>
                  {String(entry.id) === String(user.id) && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#6366f1', color: '#fff' }}>You</span>}
                </div>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#818cf8' }}>{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultScreen;
