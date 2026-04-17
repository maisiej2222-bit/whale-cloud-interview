import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import axios from 'axios';
import './InterviewBot.css';

const InterviewBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [posterContent, setPosterContent] = useState(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    startInterview();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    try {
      const response = await axios.post('/api/interview/start');
      setMessages([
        {
          role: 'assistant',
          content: response.data.message
        }
      ]);
      setInterviewId(response.data.interviewId);
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your AI interviewer. I'd like to learn about your experience. Let's start - what's your name?"
        }
      ]);
    }
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
        messages: updatedMessages
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message
      };

      setMessages([...updatedMessages, assistantMessage]);

      if (response.data.isComplete) {
        setInterviewComplete(true);
        setInterviewId(response.data.interviewId);
        // 自动生成海报文案
        generatePosterContent(response.data.interviewId);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generatePosterContent = async (id) => {
    setGeneratingPoster(true);
    try {
      const response = await axios.post('/api/interview/generate-poster', {
        interviewId: id
      });
      setPosterContent(response.data.posterContent);
    } catch (error) {
      console.error('Error generating poster content:', error);
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const downloadWord = async () => {
    if (!interviewId) return;

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
      alert('Failed to download Word document. Please try again.');
    }
  };

  const copyPosterText = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! 已复制到剪贴板');
  };

  const resetInterview = () => {
    setMessages([]);
    setInterviewComplete(false);
    setInterviewId(null);
    setPosterContent(null);
    startInterview();
  };

  return (
    <div className="interview-bot-container">
      <div className="chat-box">
        <div className="chat-header">
          <div>
            <h2>💬 AI Interview</h2>
            <p>Natural conversation powered by Claude 4.5</p>
          </div>
          {interviewComplete && (
            <div className="header-actions">
              <button className="download-btn" onClick={downloadWord}>
                <Download size={18} />
                Download Word
              </button>
              <button className="reset-btn" onClick={resetInterview}>
                <RefreshCw size={18} />
                New Interview
              </button>
            </div>
          )}
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-bubble">
                <div className="message-text">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {interviewComplete && (
            <div className="completion-notice">
              <CheckCircle size={48} color="#10b981" />
              <h3>Interview Complete!</h3>
              <p>Your interview has been saved. Generating poster content...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!interviewComplete && (
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here..."
              rows="3"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="send-btn"
            >
              <Send size={20} />
            </button>
          </div>
        )}
      </div>

      {/* 海报文案展示区 */}
      {interviewComplete && (
        <div className="poster-content-section">
          <div className="poster-header">
            <Sparkles size={24} color="#667eea" />
            <h2>🎨 Poster Content - Ready for Design!</h2>
          </div>

          {generatingPoster ? (
            <div className="generating">
              <div className="spinner"></div>
              <p>AI is crafting beautiful poster content...</p>
            </div>
          ) : posterContent ? (
            <div className="poster-blocks">
              {/* 标题 */}
              <div className="poster-block">
                <div className="block-label">
                  <span className="label-badge">Title</span>
                  <button onClick={() => copyPosterText(posterContent.title)}>📋 Copy</button>
                </div>
                <div className="block-content title-text">
                  {posterContent.title}
                </div>
              </div>

              {/* 副标题 */}
              <div className="poster-block">
                <div className="block-label">
                  <span className="label-badge">Subtitle</span>
                  <button onClick={() => copyPosterText(posterContent.subtitle)}>📋 Copy</button>
                </div>
                <div className="block-content subtitle-text">
                  {posterContent.subtitle}
                </div>
              </div>

              {/* 核心金句 */}
              <div className="poster-block highlight">
                <div className="block-label">
                  <span className="label-badge gold">Golden Quote</span>
                  <button onClick={() => copyPosterText(posterContent.quote)}>📋 Copy</button>
                </div>
                <div className="block-content quote-text">
                  "{posterContent.quote}"
                </div>
              </div>

              {/* 个人简介 */}
              <div className="poster-block">
                <div className="block-label">
                  <span className="label-badge">Bio</span>
                  <button onClick={() => copyPosterText(posterContent.bio)}>📋 Copy</button>
                </div>
                <div className="block-content bio-text">
                  {posterContent.bio}
                </div>
              </div>

              {/* 关键标签 */}
              {posterContent.tags && posterContent.tags.length > 0 && (
                <div className="poster-block">
                  <div className="block-label">
                    <span className="label-badge">Tags</span>
                    <button onClick={() => copyPosterText(posterContent.tags.join(' | '))}>📋 Copy</button>
                  </div>
                  <div className="block-content tags-grid">
                    {posterContent.tags.map((tag, idx) => (
                      <span key={idx} className="tag-badge">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 一句话精华 */}
              <div className="poster-block highlight">
                <div className="block-label">
                  <span className="label-badge gold">One-Liner</span>
                  <button onClick={() => copyPosterText(posterContent.oneLiner)}>📋 Copy</button>
                </div>
                <div className="block-content oneliner-text">
                  {posterContent.oneLiner}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default InterviewBot;
