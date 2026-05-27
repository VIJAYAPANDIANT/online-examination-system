import TopicSelection from './TopicSelection.jsx';
import Compiler from './Compiler.jsx';
import { useState, useEffect } from 'react';

const StudentDashboard = ({ user, onSelect, onLogout }) => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myData, setMyData] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/admin/leaderboard');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Map backend properties to frontend expectation
        const formattedData = data.map(item => ({
          ...item,
          id: item.studentId
        }));
        
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
        setMyRank(sorted.findIndex(s => String(s.id) === String(user.id)) + 1 || null);
        setMyData(sorted.find(s => String(s.id) === String(user.id)) || null);
      } catch (err) {
        console.warn('Backend leaderboard unreachable. Falling back to local storage.');
        const localLb = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        const sortedLb = [...localLb].sort((a, b) => b.score - a.score);
        setLeaderboard(sortedLb);
        setMyRank(sortedLb.findIndex(s => String(s.id) === String(user.id)) + 1 || null);
        setMyData(sortedLb.find(s => String(s.id) === String(user.id)) || null);
      }
    };
    
    fetchLeaderboard();
  }, [user.id]);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar navigation */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px',
        background: '#1e293b', borderRight: '1px solid #334155',
        padding: '32px 20px', display: 'flex', flexDirection: 'column', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px', padding: '0 12px' }}>
          <span style={{ fontSize: '32px' }}>🐛</span>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', margin: 0 }}>BUG</h1>
            <p style={{ color: '#64748b', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Exam Portal</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '14px 18px', borderRadius: '12px', border: 'none', textAlign: 'left',
              background: activeTab === 'tasks' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'tasks' ? '#818cf8' : '#94a3b8',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            <span style={{ fontSize: '20px' }}>📋</span> My Tasks
          </button>
          
          <button 
            onClick={() => setActiveTab('compiler')}
            style={{
              padding: '14px 18px', borderRadius: '12px', border: 'none', textAlign: 'left',
              background: activeTab === 'compiler' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'compiler' ? '#818cf8' : '#94a3b8',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            <span style={{ fontSize: '20px' }}>💻</span> Compiler
          </button>
          
          <button 
            onClick={() => setActiveTab('leaderboard')}
            style={{
              padding: '14px 18px', borderRadius: '12px', border: 'none', textAlign: 'left',
              background: activeTab === 'leaderboard' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'leaderboard' ? '#818cf8' : '#94a3b8',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🏆</span> Leaderboard
          </button>
        </div>

        <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <p title={user.name} style={{ margin: 0, fontSize: '14px', fontWeight: '700', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</p>
              <p title={user.email} style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = '#334155'; e.target.style.color = '#e2e8f0'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ marginLeft: '260px', padding: '40px' }}>
        {activeTab === 'tasks' ? (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <TopicSelection user={user} onSelect={onSelect} hideHeader={true} />
          </div>
        ) : activeTab === 'compiler' ? (
          <Compiler />
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Global Leaderboard</h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>See how you compare with other participants based on overall cumulative score.</p>

            {/* My Stats Banner */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px'
            }}>
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #334155' }}>
                <p style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Your Rank</p>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#818cf8', margin: 0 }}>#{myRank || 'N/A'}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #334155' }}>
                <p style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Overall Score</p>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>{myData?.score || 0}</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px', borderRadius: '20px', border: '1px solid #334155' }}>
                <p style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Topics Completed</p>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b', margin: 0 }}>{myData?.topicScores ? Object.keys(myData.topicScores).length : 0}</p>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div style={{ background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Best per Topic</th>
                    <th style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.id} style={{ 
                      borderBottom: '1px solid #334155',
                      background: String(entry.id) === String(user.id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      transition: 'background 0.2s'
                    }}>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          fontSize: '18px', fontWeight: '800', 
                          color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#475569'
                        }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#e2e8f0' }}>
                            {entry.name}
                            {String(entry.id) === String(user.id) && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{entry.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {entry.topicScores ? Object.entries(entry.topicScores).map(([topic, score]) => (
                            <span key={topic} title={`${topic}: ${score}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8' }}>
                              {topic}:{score}
                            </span>
                          )) : <span style={{ color: '#475569', fontSize: '12px' }}>Legacy score</span>}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#818cf8' }}>{entry.score}</span>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        No results found yet. Be the first to take an exam!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
