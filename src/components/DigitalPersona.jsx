import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import './DigitalPersona.css';

const DigitalPersona = ({ interviewData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (interviewData) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm ${interviewData.basicInfo.name}'s digital persona. I can answer questions about my work experience, philosophy, and insights based on my interview. What would you like to know?`
        }
      ]);
    }
  }, [interviewData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateResponse = (question) => {
    const lowerQuestion = question.toLowerCase();

    // 基于问题关键词生成响应
    if (lowerQuestion.includes('achievement') || lowerQuestion.includes('project') || lowerQuestion.includes('accomplish')) {
      return interviewData.personalStory || "I've worked on several impactful projects during my time here.";
    }

    if (lowerQuestion.includes('ai') || lowerQuestion.includes('artificial intelligence')) {
      return interviewData.aiUsage || "I'm excited about AI's potential to transform how we work.";
    }

    if (lowerQuestion.includes('culture') || lowerQuestion.includes('team')) {
      return interviewData.culturalInsights || "Our company culture emphasizes collaboration and innovation.";
    }

    if (lowerQuestion.includes('philosophy') || lowerQuestion.includes('approach') || lowerQuestion.includes('method')) {
      return interviewData.workPhilosophy || "I believe in continuous learning and improvement.";
    }

    if (lowerQuestion.includes('advice') || lowerQuestion.includes('tip') || lowerQuestion.includes('recommend')) {
      return `Based on my experience as a ${interviewData.basicInfo.jobTitle}, I'd say: ${interviewData.basicInfo.personalMotto || 'Stay curious, collaborate, and never stop learning.'}`;
    }

    if (lowerQuestion.includes('join') || lowerQuestion.includes('start') || lowerQuestion.includes('began')) {
      return `I joined ${interviewData.basicInfo.team} in ${interviewData.basicInfo.joinTime}. It's been an incredible journey!`;
    }

    if (lowerQuestion.includes('role') || lowerQuestion.includes('job') || lowerQuestion.includes('work')) {
      return `I'm a ${interviewData.basicInfo.jobTitle} at ${interviewData.basicInfo.team}. My work focuses on ${interviewData.personalStory?.substring(0, 100)}...`;
    }

    if (lowerQuestion.includes('cross-cultural') || lowerQuestion.includes('international')) {
      return interviewData.culturalInsights || "Working in a diverse team has been enriching.";
    }

    if (lowerQuestion.includes('motto') || lowerQuestion.includes('belief')) {
      return `My personal motto is: "${interviewData.basicInfo.personalMotto || 'Make every day count.'}"`;
    }

    if (lowerQuestion.includes('background') || lowerQuestion.includes('about you') || lowerQuestion.includes('who are you')) {
      return `I'm ${interviewData.basicInfo.name}, a ${interviewData.basicInfo.jobTitle} from ${interviewData.basicInfo.nationality}. ${interviewData.summary || 'I love what I do and believe in making a positive impact.'}`;
    }

    // 默认响应
    const responses = [
      `That's an interesting question. As a ${interviewData.basicInfo.jobTitle}, I'd say ${interviewData.workPhilosophy?.substring(0, 150)}`,
      `From my experience at ${interviewData.basicInfo.team}, I've learned that ${interviewData.culturalInsights?.substring(0, 150)}`,
      `That relates to my work on ${interviewData.personalStory?.substring(0, 150)}`,
      `${interviewData.basicInfo.personalMotto} - that's my guiding principle when thinking about questions like this.`
    ];

    return responses[Math.floor(Math.random() * responses.length)] || "That's a great question! Could you be more specific?";
  };

  const handleSend = () => {
    if (!input.trim() || loading || !interviewData) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // 模拟思考延迟
    setTimeout(() => {
      const response = generateResponse(input);

      const assistantMessage = {
        role: 'assistant',
        content: response
      };

      setMessages([...updatedMessages, assistantMessage]);
      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What are your main project achievements?",
    "How do you use AI in your daily work?",
    "What's your approach to cross-cultural communication?",
    "What advice would you give to new team members?",
    "Tell me about your work philosophy"
  ];

  const handleSuggestionClick = (question) => {
    setInput(question);
  };

  if (!interviewData) {
    return (
      <div className="digital-persona">
        <div className="no-data">
          <User size={64} color="#ccc" />
          <h3>No Interview Data Available</h3>
          <p>Please complete an interview first to create a digital persona.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="digital-persona">
      <div className="persona-container">
        {/* Persona Info Panel */}
        <div className="persona-info-panel">
          <div className="persona-avatar">
            <div className="avatar-circle">
              <User size={48} />
            </div>
            <div className="avatar-badge">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="persona-details">
            <h2>{interviewData.basicInfo.name}</h2>
            <p className="persona-title">{interviewData.basicInfo.jobTitle}</p>
            <p className="persona-team">{interviewData.basicInfo.team}</p>
          </div>

          <div className="persona-stats">
            <div className="stat">
              <label>Nationality</label>
              <span>{interviewData.basicInfo.nationality}</span>
            </div>
            <div className="stat">
              <label>Join Time</label>
              <span>{interviewData.basicInfo.joinTime}</span>
            </div>
          </div>

          {interviewData.basicInfo.personalMotto && (
            <div className="persona-motto">
              <label>Personal Motto</label>
              <p>"{interviewData.basicInfo.personalMotto}"</p>
            </div>
          )}

          {interviewData.keyTags?.length > 0 && (
            <div className="persona-tags">
              <label>Expertise</label>
              <div className="tags-list">
                {interviewData.keyTags.map((tag, idx) => (
                  <span key={idx} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="persona-about">
            <label>About</label>
            <p>{interviewData.summary || "Digital persona based on interview responses"}</p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="persona-chat">
          <div className="chat-header">
            <div className="header-left">
              <div className="status-indicator"></div>
              <div>
                <h3>Chat with Digital Persona</h3>
                <p>Ask about work experience, insights, and philosophy</p>
              </div>
            </div>
          </div>

          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <User size={24} />
                  </div>
                )}
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">
                  <User size={24} />
                </div>
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="suggested-questions">
              <label>Suggested Questions:</label>
              <div className="suggestions">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="suggestion-btn"
                    onClick={() => handleSuggestionClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about my work experience, insights, or philosophy..."
              rows="2"
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPersona;
