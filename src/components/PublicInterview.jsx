import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle, Copy, Check, Upload, Image } from 'lucide-react';
import axios from 'axios';
import './PublicInterview.css';

const PublicInterview = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [posterContent, setPosterContent] = useState(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Try to recover session
    const savedSession = localStorage.getItem('whale_interview_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setMessages(session.messages || []);
        setInterviewId(session.interviewId);
        setInterviewComplete(session.interviewComplete || false);
        setCurrentIndex(session.currentIndex || 0);
        setProfilePhoto(session.profilePhoto);
        setPhotoPreview(session.profilePhoto);
        if (session.posterContent) {
          setPosterContent(session.posterContent);
        }
      } catch (error) {
        console.error('Error recovering session:', error);
        startInterview();
      }
    } else {
      startInterview();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save session
  useEffect(() => {
    if (interviewId && messages.length > 0) {
      const session = {
        interviewId,
        messages,
        interviewComplete,
        profilePhoto,
        posterContent,
        currentIndex
      };
      localStorage.setItem('whale_interview_session', JSON.stringify(session));
    }
  }, [interviewId, messages, interviewComplete, profilePhoto, posterContent]);

  const startInterview = async () => {
    try {
      const response = await axios.post('/api/interview/start');
      setMessages([{ role: 'assistant', content: response.data.message }]);
      setInterviewId(response.data.interviewId);
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your Whale Cloud interviewer. I'd like to learn about your experience with us. Let's start - what's your name?"
      }]);
    }
  };

  const startNewInterview = () => {
    // Clear session storage
    localStorage.removeItem('whale_interview_session');

    // Reset all state
    setMessages([]);
    setInput('');
    setLoading(false);
    setInterviewComplete(false);
    setInterviewId(null);
    setPosterContent(null);
    setGeneratingPoster(false);
    setProfilePhoto(null);
    setPhotoPreview(null);

    // Start fresh interview
    startInterview();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/interview/chat', {
        interviewId,
        message: input,
        profilePhoto: profilePhoto,
        currentIndex
      });

      // Don't advance index if it was a correction
      let newIndex = currentIndex;
      if (response.data.backToQuestion !== undefined) {
        newIndex = response.data.backToQuestion;
        setCurrentIndex(newIndex);
      } else if (!response.data.isCorrection) {
        newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
      }

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message
      };

      setMessages([...updatedMessages, assistantMessage]);

      if (response.data.isComplete) {
        setInterviewComplete(true);
        // Show save confirmation, then auto-generate
        setTimeout(() => {
          if (response.data.needsSave || response.data.autoGeneratePoster) {
            generatePoster(response.data.interviewId);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generatePoster = async (id) => {
    setGeneratingPoster(true);
    try {
      const response = await axios.post('/api/interview/generate-poster', {
        interviewId: id
      });
      setPosterContent(response.data.posterContent);

      // Save poster to session storage
      const session = JSON.parse(localStorage.getItem('whale_interview_session') || '{}');
      session.posterContent = response.data.posterContent;
      localStorage.setItem('whale_interview_session', JSON.stringify(session));
    } catch (error) {
      console.error('Error generating poster:', error);
    } finally {
      setGeneratingPoster(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        setProfilePhoto(reader.result);
        setPhotoPreview(reader.result);

        // Add a system message about photo upload
        const photoMessage = {
          role: 'system',
          content: '✅ Profile photo uploaded successfully!'
        };
        const updatedMessages = [...messages, photoMessage];
        setMessages(updatedMessages);

        // Auto-progress to next question
        setLoading(true);
        try {
          const response = await axios.post('/api/interview/chat', {
            interviewId,
            message: '✅ Photo uploaded',
            profilePhoto: reader.result
          });

          const assistantMessage = {
            role: 'assistant',
            content: response.data.message
          };

          setMessages([...updatedMessages, assistantMessage]);

          if (response.data.isComplete) {
            setInterviewComplete(true);
            // Auto-generate poster immediately
            if (response.data.autoGeneratePoster) {
              generatePoster(response.data.interviewId);
            }
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="public-interview">
      {/* Chat Interface */}
      <div className="interview-card">
        <div className="card-header">
          <div>
            <h2>💬 Interview Session</h2>
            <p>Share your Whale Cloud experience with us</p>
          </div>
        </div>

        <div className="messages-area">
          {messages.map((msg, idx) => (
            <div key={idx} className={`msg ${msg.role}`}>
              <div className="msg-avatar">
                {msg.role === 'assistant' ? '👩‍💼' : msg.role === 'system' ? '📸' : '👤'}
              </div>
              <div className="msg-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg assistant">
              <div className="msg-avatar">👩‍💼</div>
              <div className="msg-bubble">
                <div className="typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          {interviewComplete && !posterContent && (
            <div className="complete-banner">
              <CheckCircle size={40} color="#10b981" />
              <div>
                <h3>Interview Complete!</h3>
                <p>Your responses have been saved. Crafting your spotlight content...</p>
              </div>
            </div>
          )}
          {interviewComplete && posterContent && (
            <div className="complete-banner saved">
              <CheckCircle size={40} color="#10b981" />
              <div>
                <h3>All Responses Saved</h3>
                <p>Scroll down to view your spotlight content and download your poster!</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!interviewComplete && (
          <div className="input-zone">
            <div className="input-container-full">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer here..."
                rows="3"
                disabled={loading}
              />
              <div className="input-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                {photoPreview ? (
                  <div className="photo-preview-small">
                    <img src={photoPreview} alt="Profile" />
                    <Check size={16} className="check-icon" />
                  </div>
                ) : (
                  <button
                    onClick={triggerPhotoUpload}
                    className="upload-button"
                    title="Upload profile photo"
                    type="button"
                  >
                    <Upload size={20} />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="send-button"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Poster Content Display */}
      {interviewComplete && (
        <div className="poster-card">
          <div className="card-header">
            <h2>✨ Your Spotlight Content</h2>
            <p>Copy and use for your feature</p>
          </div>

          {generatingPoster ? (
            <div className="generating-state">
              <div className="spinner"></div>
              <p>Crafting your spotlight content...</p>
            </div>
          ) : posterContent ? (
            <div className="poster-sections">
              {/* Title */}
              <div className="content-block">
                <div className="block-header">
                  <span className="badge">Title</span>
                  <button
                    onClick={() => copyToClipboard(posterContent.title, 'title')}
                    className="copy-btn"
                  >
                    {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedField === 'title' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="block-text title">{posterContent.title}</div>
              </div>

              {/* Motto */}
              {posterContent.motto && (
                <div className="content-block highlight">
                  <div className="block-header">
                    <span className="badge gold">Motto</span>
                    <button
                      onClick={() => copyToClipboard(posterContent.motto, 'motto')}
                      className="copy-btn"
                    >
                      {copiedField === 'motto' ? <Check size={16} /> : <Copy size={16} />}
                      {copiedField === 'motto' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="block-text motto">"{posterContent.motto}"</div>
                </div>
              )}

              {/* Introduction */}
              <div className="content-block">
                <div className="block-header">
                  <span className="badge">Introduction</span>
                  <button
                    onClick={() => copyToClipboard(posterContent.introduction, 'intro')}
                    className="copy-btn"
                  >
                    {copiedField === 'intro' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedField === 'intro' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="block-text">{posterContent.introduction}</div>
              </div>

              {/* Achievement */}
              <div className="content-block">
                <div className="block-header">
                  <span className="badge">Achievement</span>
                  <button
                    onClick={() => copyToClipboard(posterContent.achievement, 'achievement')}
                    className="copy-btn"
                  >
                    {copiedField === 'achievement' ? <Check size={16} /> : <Copy size={16} />}
                    {copiedField === 'achievement' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="block-text">{posterContent.achievement}</div>
              </div>

              {/* Q&A */}
              {posterContent.qa_session && posterContent.qa_session.length > 0 && (
                <div className="content-block">
                  <div className="block-header">
                    <span className="badge">Q&A Session</span>
                    <button
                      onClick={() => copyToClipboard(
                        posterContent.qa_session.map((qa, i) =>
                          `Q${i + 1}: ${qa.question}\n\nA${i + 1}: ${qa.answer}`
                        ).join('\n\n'),
                        'qa'
                      )}
                      className="copy-btn"
                    >
                      {copiedField === 'qa' ? <Check size={16} /> : <Copy size={16} />}
                      {copiedField === 'qa' ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  {posterContent.qa_session.map((qa, idx) => (
                    <div key={idx} className="qa-item">
                      <div className="question">
                        <strong>Q{idx + 1}:</strong> {qa.question}
                      </div>
                      <div className="answer">
                        <strong>A{idx + 1}:</strong> {qa.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Insight */}
              {posterContent.ai_insight && (
                <div className="content-block">
                  <div className="block-header">
                    <span className="badge">AI Insight</span>
                    <button
                      onClick={() => copyToClipboard(posterContent.ai_insight, 'ai')}
                      className="copy-btn"
                    >
                      {copiedField === 'ai' ? <Check size={16} /> : <Copy size={16} />}
                      {copiedField === 'ai' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="block-text">{posterContent.ai_insight}</div>
                </div>
              )}

              {/* Copy All Button */}
              <div className="full-copy-section">
                <button
                  className="copy-all-btn"
                  onClick={() => {
                    const fullText = `${posterContent.title}\n\nMotto: ${posterContent.motto}\n\nIntroduction:\n${posterContent.introduction}\n\nAchievement:\n${posterContent.achievement}\n\nQ&A Session:\n${posterContent.qa_session.map((qa, i) => `Q${i + 1}: ${qa.question}\n\nA${i + 1}: ${qa.answer}`).join('\n\n')}\n\nAI Insight:\n${posterContent.ai_insight}`;
                    copyToClipboard(fullText, 'all');
                  }}
                >
                  {copiedField === 'all' ? <Check size={20} /> : <Copy size={20} />}
                  {copiedField === 'all' ? 'All Content Copied!' : 'Copy All Content'}
                </button>
              </div>

              {/* Download Poster Button */}
              <div className="save-section">
                <div className="save-notice">
                  <CheckCircle size={20} color="#10b981" />
                  <span>Your interview has been saved successfully</span>
                </div>
                <p className="save-hint">Your responses are now stored and can be viewed by the HR team. Thank you for sharing your Whale Cloud journey!</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Start New Chat Button at Bottom */}
      {interviewComplete && posterContent && (
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: '32px',
          paddingBottom: '32px'
        }}>
          <button
            onClick={startNewInterview}
            style={{
              padding: '16px 48px',
              backgroundColor: '#0EA5E9',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#0284C7';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#0EA5E9';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <span style={{ fontSize: '24px' }}>💬</span>
            Start a New Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicInterview;
