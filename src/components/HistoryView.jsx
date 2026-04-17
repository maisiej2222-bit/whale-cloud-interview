import React, { useState, useEffect } from 'react';
import { Download, Eye, Trash2, Search } from 'lucide-react';
import axios from 'axios';
import './HistoryView.css';

const HistoryView = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const response = await axios.get('/api/interview/history');
      setInterviews(response.data.interviews || []);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInterview = async (interviewId) => {
    try {
      const response = await axios.get(`/api/interview/download/${interviewId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `interview-${interviewId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download document.');
    }
  };

  const deleteInterview = async (interviewId) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;

    try {
      await axios.delete(`/api/interview/${interviewId}`);
      setInterviews(interviews.filter(i => i.id !== interviewId));
      if (selectedInterview?.id === interviewId) {
        setSelectedInterview(null);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete interview.');
    }
  };

  const viewDetails = (interview) => {
    setSelectedInterview(interview);
  };

  const filteredInterviews = interviews.filter(interview =>
    interview.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading interviews...</p>
      </div>
    );
  }

  return (
    <div className="history-view">
      <div className="history-sidebar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="interview-list">
          {filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <p>No interviews found</p>
            </div>
          ) : (
            filteredInterviews.map((interview) => (
              <div
                key={interview.id}
                className={`interview-card ${selectedInterview?.id === interview.id ? 'active' : ''}`}
                onClick={() => viewDetails(interview)}
              >
                <div className="interview-info">
                  <h3>{interview.name || 'Unnamed'}</h3>
                  <p>{interview.jobTitle || 'No title'}</p>
                  <span className="interview-date">
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="interview-actions">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadInterview(interview.id);
                    }}
                    title="Download Word"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteInterview(interview.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="history-details">
        {selectedInterview ? (
          <div className="details-content">
            <div className="details-header">
              <h2>{selectedInterview.name}</h2>
              <button
                className="download-btn-large"
                onClick={() => downloadInterview(selectedInterview.id)}
              >
                <Download size={20} />
                Download Word Document
              </button>
            </div>

            <div className="details-section">
              <h3>Basic Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{selectedInterview.name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Job Title:</label>
                  <span>{selectedInterview.jobTitle || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Team:</label>
                  <span>{selectedInterview.team || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Interview Date:</label>
                  <span>{new Date(selectedInterview.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Interview Transcript</h3>
              <div className="transcript">
                {selectedInterview.messages?.map((msg, idx) => (
                  <div key={idx} className={`transcript-message ${msg.role}`}>
                    <div className="transcript-avatar">
                      {msg.role === 'assistant' ? '🤖' : '👤'}
                    </div>
                    <div className="transcript-content">
                      <div className="transcript-role">
                        {msg.role === 'assistant' ? 'Interviewer' : selectedInterview.name}
                      </div>
                      <div className="transcript-text">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="details-placeholder">
            <Eye size={64} color="#ccc" />
            <h3>Select an interview to view details</h3>
            <p>Click on any interview from the list to see the full transcript</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
