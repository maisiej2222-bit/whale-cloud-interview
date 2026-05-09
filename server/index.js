import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'whale2026';

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// PostgreSQL database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        name VARCHAR(255),
        company_id VARCHAR(255),
        position VARCHAR(255),
        team VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('⚠️ Database init error:', error.message);
  }
}

initDatabase();

// Data storage directory (backup)
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory storage for active interviews
const activeInterviews = new Map();

const INTERVIEW_QUESTIONS = [
  {
    id: 0,
    question: "Hi there! 😊 I'm Maisie2 from the Global HR team at Whale Cloud. My role focuses on recruiting global talent and organizing cultural activities for our overseas employees.\n\n\"Whale Spotlight\" is a project initiative to highlight outstanding international employees and showcase their achievements. I'm delighted to congratulate you on your exceptional performance! 🎉\n\nAs part of this project, we will create a poster based on your insights and share it in our group. To make this happen, I would love to conduct this online interview with you. Please take some time to answer the questions and share your experiences and journey at Whale Cloud.\n\nLet's get started! What's your full name?",
    field: 'name'
  },
  {
    id: 1,
    question: "Great to meet you! 😊 Could you provide your company ID or employee number?",
    field: 'companyId'
  },
  {
    id: 2,
    question: "When did you join our Whale Cloud family? (For example: January 2022, or Q3 2021)",
    field: 'joinTime'
  },
  {
    id: 3,
    question: "Which team or department are you working with? (For example: Cloud Platform Team, Customer Success, R&D, etc.)",
    field: 'team'
  },
  {
    id: 4,
    question: "What's your current position? (For example: Senior Software Engineer, Product Manager, Solutions Architect, etc.)",
    field: 'position'
  },
  {
    id: 5,
    question: "I'd love to know more about what you do! Could you describe your role and what a typical week looks like for you? 💼",
    field: 'currentRole'
  },
  {
    id: 6,
    question: "This is always interesting to hear! Do you have a personal motto or guiding principle that drives you in your life and work? Something that keeps you motivated when facing challenges? 💭",
    field: 'motto'
  },
  {
    id: 7,
    question: "📸 Now, let's add a face to your amazing story! Please upload a professional profile photo using the upload button (📤) in the chat interface. This will be featured in your spotlight poster!",
    field: 'photoReminder',
    requiresPhoto: true
  },
  {
    id: 8,
    question: "Let's talk about your work! What are the main projects or initiatives you're currently leading or contributing to? Please share 2-3 key projects and briefly explain what each one is about. 🚀",
    field: 'projects'
  },
  {
    id: 9,
    question: "I'd love to hear about your proudest moment! 🏆 What's the achievement or project you're most proud of during your time at Whale Cloud? Please share: What was the challenge? What was your approach? What impact did it create?",
    field: 'achievement'
  },
  {
    id: 10,
    question: "Can you share a specific example of a critical situation where your contribution made a real difference? Maybe a time when urgent support was needed, or when you helped solve a major challenge? 💪",
    field: 'contributions'
  },
  {
    id: 11,
    question: "How would you describe Whale Cloud's company culture? What makes it unique in your opinion? What do you appreciate most about working here? 🌟",
    field: 'culture'
  },
  {
    id: 12,
    question: "Working in a global company is such an enriching experience! 🌍 Could you share a specific cross-cultural collaboration story? What challenges did you encounter (communication styles, time zones, cultural differences) and how did you navigate them?",
    field: 'crossCultural'
  },
  {
    id: 13,
    question: "Let's talk about AI! 🤖 How are you currently using AI tools in your daily work? Please give specific examples - which tools, for what tasks, and how often? (For example: ChatGPT for brainstorming, Copilot for coding, AI for data analysis, etc.)",
    field: 'aiUsage'
  },
  {
    id: 14,
    question: "What's your perspective on AI's role in your field? Has it significantly changed how you work? Can you quantify the gains? (For example: 'AI helps me work 30% faster' or 'AI reduced my research time from hours to minutes') ⚡",
    field: 'aiPerspective'
  },
  {
    id: 15,
    question: "Reflecting on your journey at Whale Cloud, what are 2-3 valuable lessons you've learned? These could be professional skills, mindset shifts, or insights about teamwork and communication. 📚",
    field: 'lessons'
  },
  {
    id: 16,
    question: "Based on your experience, what advice would you give to your teammates or new members joining Whale Cloud? If you could go back to your first day, what's one thing you wish you had known? 💡",
    field: 'advice'
  },
  {
    id: 17,
    question: "We're almost done! Is there anything else you'd like to share? Maybe something we didn't cover, a success story, a challenge you overcame, or any suggestions for making Whale Cloud even better? 🌈",
    field: 'openEnded'
  },
  {
    id: 18,
    question: "Thank you so much for sharing your wonderful story with me! 🎉 Your insights are truly valuable. I'll now generate your personalized Whale Spotlight content. It's been such a pleasure learning about your journey at Whale Cloud! 💙",
    field: 'complete'
  }
];

// Save interview to database (with file backup)
async function saveInterview(interview) {
  const dataToSave = {
    ...interview,
    timestamp: interview.createdAt,
    name: interview.answers.name || 'Anonymous',
    companyId: interview.answers.companyId || 'N/A',
    joinTime: interview.answers.joinTime || 'N/A',
    team: interview.answers.team || 'N/A',
    position: interview.answers.position || 'N/A',
    currentRole: interview.answers.currentRole || 'N/A'
  };

  // Save to PostgreSQL
  try {
    await pool.query(
      `INSERT INTO interviews (id, data, name, company_id, position, team, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         data = $2, name = $3, company_id = $4, position = $5, team = $6, updated_at = NOW()`,
      [interview.id, JSON.stringify(dataToSave), dataToSave.name, dataToSave.companyId, dataToSave.position, dataToSave.team]
    );
    console.log(`✅ DB saved: ${dataToSave.name}`);
  } catch (dbError) {
    console.error('❌ DB save error:', dbError.message);
  }

  // File backup
  try {
    const filePath = path.join(DATA_DIR, `${interview.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
  } catch (fileError) {
    console.error('❌ File save error:', fileError.message);
  }
}

// Start new interview
app.post('/api/interview/start', async (req, res) => {
  try {
    const interviewId = uuidv4();
    const firstQuestion = INTERVIEW_QUESTIONS[0];

    activeInterviews.set(interviewId, {
      id: interviewId,
      messages: [{ role: 'assistant', content: firstQuestion.question }],
      currentQuestionIndex: 0,
      answers: {},
      createdAt: new Date().toISOString(),
      isPublic: true
    });

    res.json({ interviewId, message: firstQuestion.question });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Continue interview chat
app.post('/api/interview/chat', async (req, res) => {
  try {
    const { interviewId, message, profilePhoto } = req.body;

    const interview = activeInterviews.get(interviewId) || {
      id: interviewId,
      messages: [],
      currentQuestionIndex: 0,
      answers: {},
      createdAt: new Date().toISOString(),
      isPublic: true
    };

    if (profilePhoto && !interview.profilePhoto) {
      interview.profilePhoto = profilePhoto;
    }

    interview.messages.push({ role: 'user', content: message });

    const currentQuestion = INTERVIEW_QUESTIONS[interview.currentQuestionIndex];
    if (currentQuestion && currentQuestion.field !== 'photoReminder' && currentQuestion.field !== 'complete') {
      interview.answers[currentQuestion.field] = message;
    }

    interview.currentQuestionIndex++;

    const nextQuestion = INTERVIEW_QUESTIONS[interview.currentQuestionIndex];
    const isComplete = interview.currentQuestionIndex >= INTERVIEW_QUESTIONS.length ||
                       (nextQuestion && nextQuestion.field === 'complete');

    let aiMessage = '';
    if (isComplete) {
      if (nextQuestion && nextQuestion.field === 'complete') {
        aiMessage = nextQuestion.question;
      } else {
        aiMessage = "Thank you so much for sharing your story! 🎉 Your interview is complete. We're generating your spotlight content now...";
      }

      interview.messages.push({ role: 'assistant', content: aiMessage });
      activeInterviews.set(interviewId, interview);

      // Auto-generate poster
      const posterContent = generatePosterContent(interview);
      interview.posterContent = posterContent;

      await saveInterview(interview);

      res.json({
        message: aiMessage,
        isComplete: true,
        interviewId,
        posterContent,
        autoGeneratePoster: true
      });
    } else {
      aiMessage = nextQuestion.question;
      interview.messages.push({ role: 'assistant', content: aiMessage });
      activeInterviews.set(interviewId, interview);

      res.json({ message: aiMessage, isComplete: false, interviewId });
    }
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

function generatePosterContent(interview) {
  const a = interview.answers;
  return {
    title: `${a.name || 'Employee'} - ${a.position || 'Team Member'}`,
    motto: a.motto || 'Dedicated to excellence',
    introduction: `${a.name} joined Whale Cloud in ${a.joinTime}, working as ${a.position} in the ${a.team} team. ${a.currentRole || ''}`,
    achievement: a.achievement || 'Making valuable contributions to the team',
    qa_session: [
      { question: "What are your main projects?", answer: a.projects || 'Various important projects' },
      { question: "How do you use AI in your work?", answer: a.aiUsage || 'Leveraging AI tools for efficiency' },
      { question: "What advice would you give to teammates?", answer: a.advice || 'Stay curious and keep learning' }
    ],
    ai_insight: `${a.name} brings valuable experience in ${a.position}, contributing to ${a.team} with dedication and professionalism. Their perspective on ${a.culture || 'company culture'} and commitment to ${a.lessons || 'continuous learning'} make them an asset to Whale Cloud.`
  };
}

// Generate poster content endpoint (for existing interviews)
app.post('/api/interview/generate-poster', async (req, res) => {
  try {
    const { interviewId } = req.body;

    let interview = activeInterviews.get(interviewId);
    if (!interview) {
      try {
        const result = await pool.query('SELECT data FROM interviews WHERE id = $1', [interviewId]);
        if (result.rows.length > 0) {
          interview = JSON.parse(result.rows[0].data);
        }
      } catch (dbError) {
        const filePath = path.join(DATA_DIR, `${interviewId}.json`);
        if (fs.existsSync(filePath)) {
          interview = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
      }
    }

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const posterContent = generatePosterContent(interview);
    interview.posterContent = posterContent;
    await saveInterview(interview);

    res.json({ posterContent });
  } catch (error) {
    console.error('Error generating poster:', error);
    res.status(500).json({ error: 'Failed to generate poster' });
  }
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get all interviews (admin only) - Primary: database, Fallback: file
app.get('/api/admin/interviews', authenticateAdmin, async (req, res) => {
  try {
    try {
      const result = await pool.query(
        'SELECT id, name, position, team, created_at as timestamp FROM interviews ORDER BY created_at DESC'
      );
      return res.json({
        interviews: result.rows.map(r => ({
          id: r.id, name: r.name || 'Anonymous', position: r.position, team: r.team, timestamp: r.timestamp
        }))
      });
    } catch (dbError) {
      console.error('DB query error:', dbError.message);
    }

    // Fallback to file
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const interviews = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      return { id: data.id, name: data.name || 'Anonymous', position: data.position, team: data.team, timestamp: data.timestamp || data.createdAt };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ interviews });
  } catch (error) {
    console.error('Error loading interviews:', error);
    res.status(500).json({ error: 'Failed to load interviews' });
  }
});

// Get interview by ID (admin only)
app.get('/api/admin/interviews/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const result = await pool.query('SELECT data FROM interviews WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        return res.json({ interview: JSON.parse(result.rows[0].data) });
      }
    } catch (dbError) {
      console.error('DB query error:', dbError.message);
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    const interview = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ interview });
  } catch (error) {
    console.error('Error loading interview:', error);
    res.status(500).json({ error: 'Failed to load interview' });
  }
});

// Download Word document (admin only)
app.get('/api/admin/interviews/:id/download', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let interview;
    try {
      const result = await pool.query('SELECT data FROM interviews WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        interview = JSON.parse(result.rows[0].data);
      }
    } catch (dbError) {
      // fall through
    }

    if (!interview) {
      const filePath = path.join(DATA_DIR, `${id}.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      interview = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    const poster = interview.posterContent;
    if (!poster) {
      return res.status(404).json({ error: 'Poster content not found' });
    }

    const children = [];

    children.push(new Paragraph({
      text: poster.title, heading: HeadingLevel.HEADING_1, spacing: { after: 200 }
    }));

    if (poster.motto) {
      children.push(new Paragraph({
        text: `"${poster.motto}"`, heading: HeadingLevel.HEADING_2, spacing: { after: 300 }, italics: true
      }));
    }

    children.push(
      new Paragraph({ text: 'Introduction', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
      new Paragraph({ text: poster.introduction, spacing: { after: 400 } }),
      new Paragraph({ text: 'Achievement', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
      new Paragraph({ text: poster.achievement, spacing: { after: 400 } })
    );

    if (poster.qa_session && poster.qa_session.length > 0) {
      children.push(new Paragraph({
        text: 'Q&A Session', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 }
      }));
      poster.qa_session.forEach((qa, i) => {
        children.push(
          new Paragraph({ text: `Q${i + 1}: ${qa.question}`, spacing: { before: 200, after: 100 }, bold: true }),
          new Paragraph({ text: `A${i + 1}: ${qa.answer}`, spacing: { after: 200 } })
        );
      });
    }

    if (poster.ai_insight) {
      children.push(
        new Paragraph({ text: 'AI Insight', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Paragraph({ text: poster.ai_insight, spacing: { after: 400 } })
      );
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="interview-${id}.docx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Word document:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

// Delete interview (admin only)
app.delete('/api/admin/interviews/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await pool.query('DELETE FROM interviews WHERE id = $1', [id]);
    } catch (dbError) {
      // fall through
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'questionnaire',
    system: 'Whale Cloud Interview Platform',
    dbConfigured: !!process.env.DATABASE_URL
  });
});

// Serve static files in production
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🐋 Whale Cloud Interview Platform`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📋 Mode: Questionnaire`);
  console.log(`🗄️  DB: ${process.env.DATABASE_URL ? 'PostgreSQL configured' : 'File storage only'}`);
  console.log(`\n📊 Endpoints:`);
  console.log(`   Public: POST /api/interview/start, chat, generate-poster`);
  console.log(`   Admin:  POST /api/admin/login, GET /api/admin/interviews`);
  console.log(``);
});
