import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import './PosterGenerator.css';

const PosterGenerator = ({ interviewData }) => {
  const [template, setTemplate] = useState('international');
  const [language, setLanguage] = useState('en');
  const [photo, setPhoto] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(0);
  const posterRef = useRef(null);

  const templates = {
    international: {
      name: 'International Style',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    },
    minimal: {
      name: 'Minimal & Clean',
      gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '"Helvetica Neue", sans-serif'
    },
    tech: {
      name: 'Tech & Future',
      gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      fontFamily: '"Courier New", monospace'
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportPoster = async () => {
    if (!posterRef.current) return;

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false
      });

      const link = document.createElement('a');
      link.download = `poster-${interviewData?.basicInfo.name.replace(/\s/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting poster:', error);
      alert('Failed to export poster. Please try again.');
    }
  };

  if (!interviewData) {
    return (
      <div className="poster-generator">
        <div className="no-data">
          <ImageIcon size={64} color="#ccc" />
          <h3>No Interview Data Available</h3>
          <p>Please complete an interview first to generate a poster.</p>
        </div>
      </div>
    );
  }

  const currentQuote = interviewData.highlightedQuotes?.[selectedQuote] ||
    interviewData.basicInfo.personalMotto ||
    "Making an impact through innovation and collaboration";

  return (
    <div className="poster-generator">
      <div className="generator-container">
        {/* Control Panel */}
        <div className="control-panel">
          <h2>🎨 Poster Customization</h2>

          <div className="control-group">
            <label>Template Style</label>
            <div className="template-options">
              {Object.keys(templates).map(key => (
                <button
                  key={key}
                  className={`template-btn ${template === key ? 'active' : ''}`}
                  onClick={() => setTemplate(key)}
                >
                  {templates[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Language</label>
            <div className="language-options">
              <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={`lang-btn ${language === 'zh' ? 'active' : ''}`}
                onClick={() => setLanguage('zh')}
              >
                中文
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Upload Photo</label>
            <div className="photo-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                id="photo-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-upload" className="upload-btn">
                <Upload size={20} />
                {photo ? 'Change Photo' : 'Upload Photo'}
              </label>
              {photo && (
                <button
                  className="remove-photo"
                  onClick={() => setPhoto(null)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {interviewData.highlightedQuotes?.length > 1 && (
            <div className="control-group">
              <label>Select Quote ({selectedQuote + 1}/{interviewData.highlightedQuotes.length})</label>
              <div className="quote-selector">
                <button
                  onClick={() => setSelectedQuote((prev) =>
                    prev > 0 ? prev - 1 : interviewData.highlightedQuotes.length - 1
                  )}
                >
                  <RefreshCw size={16} style={{ transform: 'scaleX(-1)' }} />
                </button>
                <span className="quote-preview">
                  {currentQuote.substring(0, 50)}...
                </span>
                <button
                  onClick={() => setSelectedQuote((prev) =>
                    (prev + 1) % interviewData.highlightedQuotes.length
                  )}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="control-group">
            <button className="export-btn" onClick={exportPoster}>
              <Download size={20} />
              Export Poster (PNG)
            </button>
          </div>

          <div className="poster-info">
            <h3>Poster Details</h3>
            <ul>
              <li>Resolution: 1080x1350 (Instagram Portrait)</li>
              <li>Format: PNG with transparency</li>
              <li>Quality: High (2x scale)</li>
              <li>Optimized for: Social Media & Print</li>
            </ul>
          </div>
        </div>

        {/* Poster Preview */}
        <div className="preview-panel">
          <h2>📋 Preview</h2>
          <div className="preview-container">
            <div
              ref={posterRef}
              className={`poster poster-${template}`}
              style={{
                background: templates[template].gradient,
                fontFamily: templates[template].fontFamily
              }}
            >
              {/* Header */}
              <div className="poster-header">
                <h1>{language === 'en' ? 'EMPLOYEE SPOTLIGHT' : '员工风采'}</h1>
                <div className="header-line"></div>
              </div>

              {/* Photo Section */}
              {photo && (
                <div className="poster-photo">
                  <img src={photo} alt="Employee" />
                </div>
              )}

              {/* Employee Info */}
              <div className="poster-info-section">
                <h2 className="poster-name">{interviewData.basicInfo.name}</h2>
                <p className="poster-title">{interviewData.basicInfo.jobTitle}</p>
                <p className="poster-team">
                  {interviewData.basicInfo.team} | {interviewData.basicInfo.nationality}
                </p>
              </div>

              {/* Quote Section */}
              <div className="poster-quote">
                <div className="quote-mark">"</div>
                <p>{currentQuote}</p>
                <div className="quote-mark closing">"</div>
              </div>

              {/* Tags */}
              {interviewData.keyTags && (
                <div className="poster-tags">
                  {interviewData.keyTags.slice(0, 4).map((tag, idx) => (
                    <span key={idx} className="poster-tag">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="poster-footer">
                <p>{language === 'en' ? 'Our Culture, Our Story' : '我们的文化，我们的故事'}</p>
                <p className="join-date">
                  {language === 'en' ? 'Joined' : '加入时间'}: {interviewData.basicInfo.joinTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterGenerator;
