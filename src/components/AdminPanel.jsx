import React, { useState, useEffect } from 'react';
import { Lock, Download, Trash2, Eye, X, Calendar, User, Briefcase } from 'lucide-react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = ({ isAuthenticated, onAuthenticate }) => {
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('adminToken') || '');

  useEffect(() => {
    if (authToken && !isAuthenticated) {
      verifyToken();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadInterviews();
    }
  }, [isAuthenticated]);

  const verifyToken = async () => {
    try {
      await axios.get('/api/admin/interviews', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      onAuthenticate(true);
    } catch (error) {
      localStorage.removeItem('adminToken');
      setAuthToken('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/login', { password });
      const token = response.data.token;
      setAuthToken(token);
      localStorage.setItem('adminToken', token);
      onAuthenticate(true);
      setPassword('');
    } catch (error) {
      setAuthError(error.response?.data?.error || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAuthToken('');
    onAuthenticate(false);
    setInterviews([]);
    setSelectedInterview(null);
  };

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/interviews', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setInterviews(response.data.interviews);
    } catch (error) {
      console.error('Error loading interviews:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const viewInterview = async (id) => {
    try {
      const response = await axios.get(`/api/admin/interviews/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setSelectedInterview(response.data.interview);
    } catch (error) {
      console.error('Error loading interview details:', error);
      alert('Failed to load interview details');
    }
  };

  const downloadWord = async (id) => {
    try {
      const response = await axios.get(`/api/admin/interviews/${id}/download`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `interview-${id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download Word document');
    }
  };

  const deleteInterview = async (id) => {
    if (!confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/interviews/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setInterviews(interviews.filter(i => i.id !== id));
      if (selectedInterview?.id === id) {
        setSelectedInterview(null);
      }
      alert('Interview deleted successfully');
    } catch (error) {
      console.error('Error deleting interview:', error);
      alert('Failed to delete interview');
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <div className="login-header">
            <Lock size={48} color="#667eea" />
            <h2>Admin Access</h2>
            <p>Enter password to view interviews</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              disabled={loading}
              autoFocus
            />
            {authError && <div className="error-message">{authError}</div>}
            <button type="submit" disabled={loading || !password}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h2>📋 Interview Records</h2>
          <p>Total interviews: {interviews.length}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {loading && interviews.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="empty-state">
          <p>No interviews yet. Share the public interview link to get started!</p>
        </div>
      ) : (
        <div className="admin-content">
          {/* Interview List */}
          <div className="interview-list">
            {interviews.map((interview) => (
              <div key={interview.id} className="interview-item">
                <div className="interview-info">
                  <div className="interview-meta">
                    <User size={16} />
                    <strong>{interview.name || 'Anonymous'}</strong>
                  </div>
                  <div className="interview-meta">
                    <Calendar size={16} />
                    <span>{formatDate(interview.timestamp)}</span>
                  </div>
                  {interview.position && (
                    <div className="interview-meta">
                      <Briefcase size={16} />
                      <span>{interview.position}</span>
                    </div>
                  )}
                </div>
                <div className="interview-actions">
                  <button
                    onClick={() => viewInterview(interview.id)}
                    className="action-btn view"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => downloadWord(interview.id)}
                    className="action-btn download"
                    title="Download Word"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => deleteInterview(interview.id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detail View Modal */}
          {selectedInterview && (
            <div className="modal-overlay" onClick={() => setSelectedInterview(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Interview Details</h3>
                  <button
                    onClick={() => setSelectedInterview(null)}
                    className="close-btn"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  {/* Profile Photo */}
                  {selectedInterview.profilePhoto && (
                    <div className="detail-section">
                      <h4>Profile Photo</h4>
                      <div className="profile-photo-display">
                        <img src={selectedInterview.profilePhoto} alt="Profile" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = selectedInterview.profilePhoto;
                            a.download = `${selectedInterview.name || 'profile'}-photo.jpg`;
                            a.click();
                          }}
                          className="action-btn download"
                          style={{ width: 'auto', padding: '0 16px', gap: '8px' }}
                          title="Download Photo"
                        >
                          <Download size={16} />
                          Download Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Name:</span>
                        <span className="value">{selectedInterview.name || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Company ID:</span>
                        <span className="value">{selectedInterview.companyId || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Join Time:</span>
                        <span className="value">{selectedInterview.joinTime || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Team:</span>
                        <span className="value">{selectedInterview.team || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Position:</span>
                        <span className="value">{selectedInterview.position || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Current Role:</span>
                        <span className="value">{selectedInterview.currentRole || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversation History */}
                  <div className="detail-section">
                    <h4>Conversation History</h4>
                    <div className="conversation">
                      {selectedInterview.messages.map((msg, idx) => (
                        <div key={idx} className={`conv-message ${msg.role}`}>
                          <div className="conv-avatar">
                            {msg.role === 'assistant' ? '🤖' : '👤'}
                          </div>
                          <div className="conv-bubble">
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Poster Content */}
                  {selectedInterview.posterContent && (
                    <div className="detail-section">
                      <h4>Generated Spotlight Content</h4>
                      <div className="poster-preview">
                        <div className="poster-block">
                          <strong>Title:</strong>
                          <p>{selectedInterview.posterContent.title}</p>
                        </div>
                        {selectedInterview.posterContent.motto && (
                          <div className="poster-block highlight">
                            <strong>Motto:</strong>
                            <p className="motto-text">"{selectedInterview.posterContent.motto}"</p>
                          </div>
                        )}
                        <div className="poster-block">
                          <strong>Introduction:</strong>
                          <p>{selectedInterview.posterContent.introduction}</p>
                        </div>
                        <div className="poster-block">
                          <strong>Achievement:</strong>
                          <p>{selectedInterview.posterContent.achievement}</p>
                        </div>
                        {selectedInterview.posterContent.qa_session && (
                          <div className="poster-block">
                            <strong>Q&A Session:</strong>
                            {selectedInterview.posterContent.qa_session.map((qa, idx) => (
                              <div key={idx} className="qa-pair">
                                <p><strong>Q{idx + 1}:</strong> {qa.question}</p>
                                <p><strong>A{idx + 1}:</strong> {qa.answer}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedInterview.posterContent.ai_insight && (
                          <div className="poster-block">
                            <strong>AI Insight:</strong>
                            <p>{selectedInterview.posterContent.ai_insight}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    onClick={() => downloadWord(selectedInterview.id)}
                    className="download-btn-large"
                  >
                    <Download size={20} />
                    Download Word Document
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
