import React, { useState, useEffect } from 'react';
import axios from 'axios';
import store from '../data/store';
import { getApiBaseUrl } from '../data/config.js';

const AdminDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [topics, setTopics] = useState(store.getTopics());
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ key: '', label: '', icon: '🧩', color: '#6366f1', desc: '' });
  const [newQ, setNewQ] = useState({ 
    questionText: '', 
    optionA: '', 
    optionB: '', 
    optionC: '', 
    optionD: '', 
    correctOption: 'A', 
    topicCategory: 'JAVA' 
  });

  const syncLocalDataToBackend = async () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('exam_users') || '[]');
      if (storedUsers.length === 0) return;

      for (const localUser of storedUsers) {
        let dbId = null;
        try {
          const regRes = await axios.post(getApiBaseUrl() + '/api/auth/register', {
            name: localUser.name,
            email: localUser.email.toLowerCase(),
            password: localUser.password
          });
          dbId = regRes.data.id;
        } catch (err) {
          if (err.response && err.response.status === 400) {
            try {
              const loginRes = await axios.post(getApiBaseUrl() + '/api/auth/login', {
                email: localUser.email.toLowerCase(),
                password: localUser.password
              });
              dbId = loginRes.data.id;
            } catch (loginErr) {
              console.error(loginErr);
            }
          }
        }

        if (dbId) {
          const localResultsKeys = [`examResults_${localUser.id}`, `examResults_${dbId}`];
          for (const key of localResultsKeys) {
            const localResults = JSON.parse(localStorage.getItem(key) || '[]');
            if (localResults.length > 0) {
              let syncedCount = 0;
              for (const res of localResults) {
                if (res.synced) continue;
                try {
                  await axios.post(getApiBaseUrl() + '/api/exam/submit', {
                    studentId: dbId,
                    questionId: res.questionId,
                    selectedOption: res.selected
                  });
                  res.synced = true;
                  syncedCount++;
                } catch (submitErr) {
                  if (submitErr.response && submitErr.response.status === 400) {
                    res.synced = true;
                    syncedCount++;
                  } else {
                    break;
                  }
                }
              }
              if (syncedCount > 0) {
                localStorage.setItem(`examResults_${dbId}`, JSON.stringify(localResults));
                if (key !== `examResults_${dbId}`) {
                  localStorage.removeItem(key);
                }
              }
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn("Auto-sync error:", syncErr);
    }
  };

  useEffect(() => {
    const init = async () => {
      await syncLocalDataToBackend();
      fetchData();
    };
    init();
  }, []);

  const fetchData = async () => {
    try {
      const res1 = await axios.get(getApiBaseUrl() + '/api/admin/students');
      const backendStudents = res1.data;
      setStudents(backendStudents);

      const res2 = await axios.get(getApiBaseUrl() + '/api/admin/leaderboard');
      const backendLb = res2.data.map(item => ({ ...item, id: item.studentId }));

      const localLb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
      const mergedMap = new Map();

      localLb.forEach(item => {
        const key = item.email ? item.email.toLowerCase() : String(item.id);
        mergedMap.set(key, item);
      });

      backendLb.forEach(item => {
        const studentDetails = backendStudents.find(s => String(s.id) === String(item.id));
        const email = item.email || (studentDetails ? studentDetails.email : '');
        const key = email ? email.toLowerCase() : String(item.id);

        const existing = mergedMap.get(key);
        if (existing) {
          mergedMap.set(key, {
            ...existing,
            ...item,
            score: Math.max(existing.score, item.score)
          });
        } else {
          mergedMap.set(key, {
            ...item,
            email: email
          });
        }
      });

      const mergedLb = Array.from(mergedMap.values()).sort((a, b) => b.score - a.score);
      setLeaderboard(mergedLb);
    } catch (err) {
      console.warn('Backend unreachable. Falling back to local storage.', err);
      setStudents(JSON.parse(localStorage.getItem('exam_users') || '[]'));
      setLeaderboard(JSON.parse(localStorage.getItem('leaderboard') || '[]'));
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    try {
      store.addQuestion(newQ);
      alert('Question added successfully!');
      setNewQ({ ...newQ, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '' });
    } catch (err) {
      alert('Failed to add question: ' + err.message);
    }
  };

  const handleCreateTopic = (e) => {
    e.preventDefault();
    try {
      if (!newTopic.key || !newTopic.label) return alert("Key and Label are required");
      store.addTopic({ ...newTopic, key: newTopic.key.toUpperCase() });
      setTopics(store.getTopics());
      setNewQ({ ...newQ, topicCategory: newTopic.key.toUpperCase() });
      setShowNewTopicForm(false);
      setNewTopic({ key: '', label: '', icon: '🧩', color: '#6366f1', desc: '' });
      alert('Topic created!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    try { await axios.delete(getApiBaseUrl() + `/api/admin/students/${id}`); fetchData(); } catch { alert('Failed'); }
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '14px', marginBottom: '12px' };
  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: tab === t ? '#6366f1' : '#1e293b', color: '#fff', fontWeight: '600', fontSize: '14px' }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#e2e8f0' }}>⚡ Admin Dashboard</h1>
          <button onClick={onLogout} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8' }}>Logout</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {tabBtn('stats', '📊 Stats')}
          {tabBtn('students', '👥 Students')}
          {tabBtn('reports', '🕒 Login Reports')}
          {tabBtn('leaderboard', '🏆 Leaderboard')}
          {tabBtn('questions', '📝 Add Test/Question')}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {(() => {
              const activeTests = Object.keys(localStorage).filter(k => k.startsWith('active_exam_user_')).length;
              
              return (
                <>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '30px', borderRadius: '20px', border: '1px solid #334155' }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Registered Students</p>
                    <p style={{ fontSize: '42px', fontWeight: '900', color: '#818cf8', margin: 0 }}>{students.length}</p>
                    <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>Including demo accounts</p>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '30px', borderRadius: '20px', border: '1px solid #334155' }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Currently Taking Test</p>
                    <p style={{ fontSize: '42px', fontWeight: '900', color: '#10b981', margin: 0 }}>{activeTests}</p>
                    <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>Live active sessions</p>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '30px', borderRadius: '20px', border: '1px solid #334155' }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', marginBottom: '8px' }}>Tests Completed</p>
                    <p style={{ fontSize: '42px', fontWeight: '900', color: '#f59e0b', margin: 0 }}>{leaderboard.length}</p>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Students Tab - Detailed Registeration Info */}
        {tab === 'students' && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#e2e8f0' }}>Registered Students Details</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    {['ID', 'Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '13px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '14px', color: '#818cf8', fontWeight: 'bold' }}>{s.id}</td>
                      <td style={{ padding: '14px', fontWeight: '600', color: '#e2e8f0' }}>{s.name}</td>
                      <td style={{ padding: '14px', color: '#94a3b8' }}>{s.email}</td>
                      <td style={{ padding: '14px', fontSize: '12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: '#0f172a', color: '#818cf8' }}>{s.role || 'STUDENT'}</span></td>
                      <td style={{ padding: '14px' }}>
                        {localStorage.getItem('active_exam_user_' + s.id) ? 
                          <span style={{ color: '#10b981', fontSize: '12px' }}>● Taking {localStorage.getItem('active_exam_user_' + s.id)}</span> : 
                          <span style={{ color: '#475569', fontSize: '12px' }}>Inactive</span>
                        }
                      </td>
                      <td style={{ padding: '14px' }}>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete student "${s.name}"?`)) {
                              handleDelete(s.id);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={e => e.target.style.opacity = 0.8}
                          onMouseLeave={e => e.target.style.opacity = 1}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab - Login/Logout Timing */}
        {tab === 'reports' && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#e2e8f0' }}>Student Session Reports</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Student', 'Login Time', 'Logout Time', 'Duration'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...JSON.parse(localStorage.getItem('session_logs') || '[]')].reverse().slice(0, 20).map(log => {
                  const login = new Date(log.loginTime);
                  const logout = log.logoutTime ? new Date(log.logoutTime) : null;
                  const duration = logout ? Math.round((logout - login) / 60000) : null;

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{log.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{log.email}</div>
                      </td>
                      <td style={{ padding: '14px', color: '#94a3b8', fontSize: '13px' }}>{login.toLocaleTimeString()} <br/> <small>{login.toLocaleDateString()}</small></td>
                      <td style={{ padding: '14px', color: '#94a3b8', fontSize: '13px' }}>
                        {logout ? <>{logout.toLocaleTimeString()} <br/> <small>{logout.toLocaleDateString()}</small></> : <span style={{ color: '#10b981', fontWeight: '700' }}>Active Now</span>}
                      </td>
                      <td style={{ padding: '14px', color: '#6366f1', fontWeight: '600' }}>
                        {duration !== null ? `${duration} min` : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#e2e8f0' }}>🏆 Overall Cumulative Leaderboard</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Student ID</th>
                    <th style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>User Details</th>
                    <th style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Best per Topic</th>
                    <th style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...leaderboard].sort((a,b) => b.score - a.score).map((entry, i) => {
                    const studentDetails = students.find(s => String(s.id) === String(entry.id));
                    const email = entry.email || (studentDetails ? studentDetails.email : 'N/A');

                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '14px' }}>
                          <span style={{ 
                            fontSize: '18px', fontWeight: '800', 
                            color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#64748b'
                          }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: '#818cf8', fontWeight: 'bold' }}>{entry.id}</td>
                        <td style={{ padding: '14px' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#e2e8f0' }}>{entry.name || `Student ${entry.id}`}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{email}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {entry.topicScores ? Object.entries(entry.topicScores).map(([topic, score]) => (
                              <span key={topic} title={`${topic}: ${score}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8' }}>
                                {topic}:{score}
                              </span>
                            )) : <span style={{ color: '#475569', fontSize: '12px' }}>{entry.score > 0 ? 'Cumulative score' : 'No topics'}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#818cf8' }}>{entry.score}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No users on the leaderboard yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Question Tab */}
        {tab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* New Topic Toggle */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#e2e8f0', margin: 0 }}>Need a new topic?</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>Create a new category before adding questions.</p>
              </div>
              <button onClick={() => setShowNewTopicForm(!showNewTopicForm)} style={{ padding: '10px 20px', borderRadius: '8px', background: showNewTopicForm ? '#ef4444' : '#6366f1', color: '#fff', border: 'none', fontWeight: '600' }}>
                {showNewTopicForm ? 'Cancel' : '➕ Create New Topic'}
              </button>
            </div>

            {/* New Topic Form */}
            {showNewTopicForm && (
              <div style={{ background: '#1e293b', borderRadius: '16px', padding: '30px', border: '2px solid #6366f1' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#e2e8f0' }}>Create New Topic</h2>
                <form onSubmit={handleCreateTopic}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input value={newTopic.label} onChange={e => setNewTopic({ ...newTopic, label: e.target.value })} placeholder="Topic Name (e.g. React)" required style={inputStyle} />
                    <input value={newTopic.key} onChange={e => setNewTopic({ ...newTopic, key: e.target.value.toUpperCase() })} placeholder="Topic Key (e.g. REACT)" required style={inputStyle} />
                    <input value={newTopic.icon} onChange={e => setNewTopic({ ...newTopic, icon: e.target.value })} placeholder="Icon Emoji (e.g. ⚛️)" required style={inputStyle} />
                    <input value={newTopic.color} title="Pick a color" type="color" onChange={e => setNewTopic({ ...newTopic, color: e.target.value })} style={{ ...inputStyle, padding: '2px' }} />
                  </div>
                  <textarea value={newTopic.desc} onChange={e => setNewTopic({ ...newTopic, desc: e.target.value })} placeholder="Description (e.g. 50 MCQs on Modern Frontend...)" required rows={2} style={{ ...inputStyle, resize: 'none' }} />
                  <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontSize: '15px', fontWeight: '700' }}>
                    Save Topic
                  </button>
                </form>
              </div>
            )}

            {/* Add Question Form */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '30px', border: '1px solid #334155' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#e2e8f0' }}>Add New Question</h2>
              <form onSubmit={handleAddQuestion}>
                <textarea value={newQ.questionText} onChange={e => setNewQ({ ...newQ, questionText: e.target.value })} placeholder="Question Text" required rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input value={newQ.optionA} onChange={e => setNewQ({ ...newQ, optionA: e.target.value })} placeholder="Option A" required style={inputStyle} />
                  <input value={newQ.optionB} onChange={e => setNewQ({ ...newQ, optionB: e.target.value })} placeholder="Option B" required style={inputStyle} />
                  <input value={newQ.optionC} onChange={e => setNewQ({ ...newQ, optionC: e.target.value })} placeholder="Option C" required style={inputStyle} />
                  <input value={newQ.optionD} onChange={e => setNewQ({ ...newQ, optionD: e.target.value })} placeholder="Option D" required style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                  <select value={newQ.correctOption} onChange={e => setNewQ({ ...newQ, correctOption: e.target.value })} style={inputStyle}>
                    <option value="A">Correct: A</option><option value="B">Correct: B</option>
                    <option value="C">Correct: C</option><option value="D">Correct: D</option>
                  </select>
                  <select value={newQ.topicCategory} onChange={e => setNewQ({ ...newQ, topicCategory: e.target.value })} style={inputStyle}>
                    {topics.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" style={{ marginTop: '8px', width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '16px', fontWeight: '700' }}>
                  Add Question
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
