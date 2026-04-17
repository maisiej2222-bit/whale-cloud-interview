import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
app.use(express.json({ limit: '10mb' })); // 支持照片上传

// Data storage directory
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory storage for active interviews
const activeInterviews = new Map();

// 预设问题列表 - 优化版：更具体、更有引导性
const INTERVIEW_QUESTIONS = [
  {
    id: 1,
    question: "Hello! 👋 Welcome to the Whale Cloud Employee Spotlight Interview. I'm excited to hear your story! Let's start with the basics - what's your full name?",
    field: 'name'
  },
  {
    id: 2,
    question: "Great to meet you! Could you provide your company ID or employee number?",
    field: 'companyId'
  },
  {
    id: 3,
    question: "When did you join Whale Cloud Technology? (For example: January 2022, or Q3 2021)",
    field: 'joinTime'
  },
  {
    id: 4,
    question: "Which team or department are you currently working with? (For example: Cloud Platform Team, Customer Success, R&D, etc.)",
    field: 'team'
  },
  {
    id: 5,
    question: "What's your current position or job title? (For example: Senior Software Engineer, Product Manager, Solutions Architect, etc.)",
    field: 'position'
  },
  {
    id: 6,
    question: "Could you describe your current role in more detail? What are your day-to-day responsibilities and what does a typical week look like for you?",
    field: 'currentRole'
  },
  {
    id: 7,
    question: "Do you have a personal motto or guiding principle that drives you in your life and work? Something that keeps you motivated when facing challenges? 💭",
    field: 'motto'
  },
  {
    id: 8,
    question: "📸 Before we continue, please upload a professional profile photo using the upload button (📤) in the chat interface. This will be featured in your spotlight!",
    field: 'photoReminder'
  },
  {
    id: 9,
    question: "Now let's talk about your work! What are the main projects or initiatives you're currently leading or contributing to? Please name 2-3 key projects and briefly explain what each one is about.",
    field: 'projects'
  },
  {
    id: 10,
    question: "🏆 What's the achievement or project you're most proud of during your time at Whale Cloud? Please share specific details: What was the challenge? What was your approach? What impact did it create for the team or customers?",
    field: 'achievement'
  },
  {
    id: 11,
    question: "Can you share a specific example of a critical situation where your contribution made a significant difference? Maybe a time when urgent support was needed, or when you helped solve a major technical challenge?",
    field: 'contributions'
  },
  {
    id: 12,
    question: "How would you describe Whale Cloud's company culture? What makes it unique in your opinion? What do you appreciate most about working here?",
    field: 'culture'
  },
  {
    id: 13,
    question: "🌍 Working in a global company means collaborating across cultures and time zones. Could you share a specific experience of cross-cultural collaboration? What challenges did you encounter (maybe communication styles, time zone differences, or cultural differences) and how did you navigate them?",
    field: 'crossCultural'
  },
  {
    id: 14,
    question: "🤖 Let's talk about AI! How are you currently using AI tools in your daily work? Please give specific examples - which tools do you use, for what tasks, and how often? (For example: using ChatGPT for code review, Copilot for coding assistance, AI for data analysis, etc.)",
    field: 'aiUsage'
  },
  {
    id: 15,
    question: "What's your perspective on AI's role in your field? Has AI significantly changed how you work? Can you quantify the efficiency gains? (For example: 'AI helps me code 30% faster' or 'AI reduced my research time from hours to minutes')",
    field: 'aiPerspective'
  },
  {
    id: 16,
    question: "Reflecting on your professional journey at Whale Cloud, what are 2-3 valuable lessons you've learned? These could be technical skills, soft skills, mindset shifts, or insights about teamwork and communication.",
    field: 'lessons'
  },
  {
    id: 17,
    question: "💡 Based on your experience, what advice would you give to your teammates or new members joining Whale Cloud? If you could go back to your first day, what's one thing you wish you had known?",
    field: 'advice'
  },
  {
    id: 18,
    question: "Thank you so much for sharing these valuable insights! 🎉 Your interview is now complete. We'll generate your personalized spotlight content shortly. It's been wonderful learning about your journey at Whale Cloud!",
    field: 'complete'
  }
];

// Start new interview
app.post('/api/interview/start', async (req, res) => {
  try {
    const interviewId = uuidv4();
    const firstQuestion = INTERVIEW_QUESTIONS[0];

    activeInterviews.set(interviewId, {
      id: interviewId,
      messages: [
        { role: 'assistant', content: firstQuestion.question }
      ],
      currentQuestionIndex: 0,
      answers: {},
      createdAt: new Date().toISOString(),
      isPublic: true
    });

    res.json({
      interviewId,
      message: firstQuestion.question
    });
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

    // Save profile photo if provided
    if (profilePhoto && !interview.profilePhoto) {
      interview.profilePhoto = profilePhoto;
    }

    // Add user message
    interview.messages.push({ role: 'user', content: message });

    // Save answer
    const currentQuestion = INTERVIEW_QUESTIONS[interview.currentQuestionIndex];
    if (currentQuestion && currentQuestion.field !== 'photoReminder' && currentQuestion.field !== 'complete') {
      interview.answers[currentQuestion.field] = message;
    }

    // Move to next question
    interview.currentQuestionIndex++;

    // Check if interview is complete
    const isComplete = interview.currentQuestionIndex >= INTERVIEW_QUESTIONS.length;

    let aiMessage = '';
    if (isComplete) {
      aiMessage = "Thank you so much for sharing your story! 🎉 Your interview is complete. We're generating your spotlight content now...";

      // Save interview
      saveInterview(interview);
    } else {
      const nextQuestion = INTERVIEW_QUESTIONS[interview.currentQuestionIndex];
      aiMessage = nextQuestion.question;
    }

    interview.messages.push({ role: 'assistant', content: aiMessage });
    activeInterviews.set(interviewId, interview);

    res.json({
      message: aiMessage,
      isComplete,
      interviewId
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Generate poster content (simplified without AI)
app.post('/api/interview/generate-poster', async (req, res) => {
  try {
    const { interviewId } = req.body;

    let interview = activeInterviews.get(interviewId);
    if (!interview) {
      // Try to load from file
      const filePath = path.join(DATA_DIR, `${interviewId}.json`);
      if (fs.existsSync(filePath)) {
        interview = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    }

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Generate simple poster content from answers
    const posterContent = {
      title: `${interview.answers.name || 'Employee'} - ${interview.answers.position || 'Team Member'}`,
      motto: interview.answers.motto || 'Dedicated to excellence',
      introduction: `${interview.answers.name} joined Whale Cloud in ${interview.answers.joinTime}, working as ${interview.answers.position} in the ${interview.answers.team} team. ${interview.answers.currentRole || ''}`,
      achievement: interview.answers.achievement || 'Making valuable contributions to the team',
      qa_session: [
        {
          question: "What are your main projects?",
          answer: interview.answers.projects || 'Various important projects'
        },
        {
          question: "How do you use AI in your work?",
          answer: interview.answers.aiUsage || 'Leveraging AI tools for efficiency'
        },
        {
          question: "What advice would you give to teammates?",
          answer: interview.answers.advice || 'Stay curious and keep learning'
        }
      ],
      ai_insight: `${interview.answers.name} brings valuable experience in ${interview.answers.position}, contributing to ${interview.answers.team} with dedication and professionalism. Their perspective on ${interview.answers.culture || 'company culture'} and commitment to ${interview.answers.lessons || 'continuous learning'} make them an asset to Whale Cloud.`
    };

    // Save poster content
    interview.posterContent = posterContent;
    saveInterview(interview);

    res.json({ posterContent });
  } catch (error) {
    console.error('Error generating poster:', error);
    res.status(500).json({ error: 'Failed to generate poster' });
  }
});

// Save interview to file
function saveInterview(interview) {
  try {
    const filePath = path.join(DATA_DIR, `${interview.id}.json`);
    const dataToSave = {
      ...interview,
      timestamp: interview.createdAt,
      name: interview.answers.name,
      companyId: interview.answers.companyId,
      joinTime: interview.answers.joinTime,
      team: interview.answers.team,
      position: interview.answers.position,
      currentRole: interview.answers.currentRole
    };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    console.error('Error saving interview:', error);
  }
}

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

// Get all interviews (admin only)
app.get('/api/admin/interviews', authenticateAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const interviews = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      return {
        id: data.id,
        name: data.name || 'Anonymous',
        position: data.position,
        team: data.team,
        timestamp: data.timestamp || data.createdAt
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ interviews });
  } catch (error) {
    console.error('Error loading interviews:', error);
    res.status(500).json({ error: 'Failed to load interviews' });
  }
});

// Get interview by ID (admin only)
app.get('/api/admin/interviews/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
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
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const interview = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const poster = interview.posterContent;

    if (!poster) {
      return res.status(404).json({ error: 'Poster content not found' });
    }

    // Create Word document
    const children = [];

    // Title
    children.push(
      new Paragraph({
        text: poster.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );

    // Motto
    if (poster.motto) {
      children.push(
        new Paragraph({
          text: `"${poster.motto}"`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 300 },
          italics: true
        })
      );
    }

    // Introduction
    children.push(
      new Paragraph({
        text: 'Introduction',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        text: poster.introduction,
        spacing: { after: 400 }
      })
    );

    // Achievement
    children.push(
      new Paragraph({
        text: 'Achievement',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        text: poster.achievement,
        spacing: { after: 400 }
      })
    );

    // Q&A Session
    if (poster.qa_session && poster.qa_session.length > 0) {
      children.push(
        new Paragraph({
          text: 'Q&A Session',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        })
      );

      poster.qa_session.forEach((qa, index) => {
        children.push(
          new Paragraph({
            text: `Q${index + 1}: ${qa.question}`,
            spacing: { before: 200, after: 100 },
            bold: true
          }),
          new Paragraph({
            text: `A${index + 1}: ${qa.answer}`,
            spacing: { after: 200 }
          })
        );
      });
    }

    // AI Insight
    if (poster.ai_insight) {
      children.push(
        new Paragraph({
          text: 'AI Insight',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
          text: poster.ai_insight,
          spacing: { after: 400 }
        })
      );
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
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
app.delete('/api/admin/interviews/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Interview deleted successfully' });
    } else {
      res.status(404).json({ error: 'Interview not found' });
    }
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
    system: 'Whale Cloud Interview Platform'
  });
});

// Serve static files in production
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // All other routes return the index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n🐋 Whale Cloud Interview Platform`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📋 Mode: Questionnaire (No AI required)`);
  console.log(`\n📊 Endpoints:`);
  console.log(`   Public:`);
  console.log(`   - POST /api/interview/start`);
  console.log(`   - POST /api/interview/chat`);
  console.log(`   - POST /api/interview/generate-poster`);
  console.log(`\n   Admin:`);
  console.log(`   - POST /api/admin/login`);
  console.log(`   - GET  /api/admin/interviews`);
  console.log(`   - GET  /api/admin/interviews/:id`);
  console.log(`   - GET  /api/admin/interviews/:id/download`);
  console.log(`   - DELETE /api/admin/interviews/:id`);
  console.log(``);
});
