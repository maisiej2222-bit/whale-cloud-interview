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

// Data storage directories
const DATA_DIR = path.join(__dirname, '../data');
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// In-memory storage for active interviews
const activeInterviews = new Map();

// 预设问题列表 - Maisie2 优化版
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
    const { interviewId, message, profilePhoto, currentIndex } = req.body;

    // Try to recover from memory or create new
    let interview = activeInterviews.get(interviewId);

    // If not in memory, try file recovery
    if (!interview) {
      const filePath = path.join(DATA_DIR, `${interviewId}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const saved = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          interview = { ...saved, currentQuestionIndex: saved.currentQuestionIndex || 0 };
          console.log(`📂 Recovered from file: ${interviewId}`);
        } catch (e) { /* file corrupted, start fresh */ }
      }
    }

    // If still not found, use client-provided index to recover position
    if (!interview) {
      interview = {
        id: interviewId,
        messages: [],
        currentQuestionIndex: currentIndex || 0,
        answers: {},
        createdAt: new Date().toISOString(),
        isPublic: true
      };
    } else if (currentIndex !== undefined && currentIndex > interview.currentQuestionIndex) {
      // Client knows better position (e.g. after server restart)
      interview.currentQuestionIndex = currentIndex;
    }

    // Save profile photo as file if provided
    if (profilePhoto && !interview.profilePhoto) {
      try {
        // Extract base64 data
        const matches = profilePhoto.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const photoData = matches[2];
          const photoFilename = `${interviewId}.${ext}`;
          const photoPath = path.join(PHOTOS_DIR, photoFilename);
          fs.writeFileSync(photoPath, Buffer.from(photoData, 'base64'));
          interview.profilePhoto = `/api/photo/${interviewId}`;
          console.log(`📸 Photo saved: ${photoFilename} (${(photoData.length * 0.75 / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        console.error('Error saving photo:', err.message);
      }
    }

    // Add user message
    interview.messages.push({ role: 'user', content: message });

    const currentQuestion = INTERVIEW_QUESTIONS[interview.currentQuestionIndex];

    // Detect if user is trying to correct/undo their answer
    const correctionPatterns = [
      /^(wait|no|oops|sorry|actually|hold on|hang on)[\s,!.]/i,
      /^(i\s+meant?|let\s+me\s+(correct|change|fix|redo|retry|edit))[\s,!.]/i,
      /^(change|edit|correct|fix|undo|redo|revise)\s+(my\s+)?(answer|that|this|it)/i,
      /^(that'?s?\s+wrong|typo|mistake|mis-?type)/i,
      /^(can\s+(i|you)\s+(go\s+back|undo|delete|remove|change|edit|fix|correct))/i,
      /^(go\s+back|undo|revert|back\s+up|previous)/i,
    ];

    // Also detect "change my [field]" patterns to go back to specific question
    const fieldCorrectionPattern = /^(?:change|correct|edit|fix|redo|re-?do)\s+(?:my\s+)?(.+)$/i;
    const fieldMatch = message.match(fieldCorrectionPattern);
    let targetField = null;

    if (fieldMatch) {
      const fieldHint = fieldMatch[1].toLowerCase().replace(/\s+/g, '');
      const fieldMap = {
        'name': 'name', 'myname': 'name', 'fullname': 'name',
        'id': 'companyId', 'companyid': 'companyId', 'employeenumber': 'companyId', 'employeeno': 'companyId',
        'jointime': 'joinTime', 'startdate': 'joinTime', 'date': 'joinTime',
        'team': 'team', 'department': 'team', 'dept': 'team',
        'position': 'position', 'role': 'position', 'jobtitle': 'position', 'title': 'position',
        'currentrole': 'currentRole', 'description': 'currentRole',
        'motto': 'motto', 'guidingprinciple': 'motto',
        'projects': 'projects', 'project': 'projects',
        'achievement': 'achievement', 'accomplishment': 'achievement', 'proudestmoment': 'achievement',
        'contributions': 'contributions', 'contribution': 'contributions',
        'culture': 'culture', 'companyculture': 'culture',
        'crosscultural': 'crossCultural', 'crossculture': 'crossCultural',
        'aiusage': 'aiUsage', 'aitools': 'aiUsage', 'ai': 'aiUsage',
        'aiperspective': 'aiPerspective', 'aiview': 'aiPerspective',
        'lessons': 'lessons', 'lesson': 'lessons',
        'advice': 'advice', 'suggestion': 'advice',
        'openended': 'openEnded', 'other': 'openEnded',
        'photo': 'photoReminder', 'profilephoto': 'photoReminder', 'picture': 'photoReminder',
      };
      targetField = fieldMap[fieldHint] || null;

      // If they want to correct a specific field, go back to that question
      if (targetField) {
        const targetIndex = INTERVIEW_QUESTIONS.findIndex(q => q.field === targetField);
        if (targetIndex >= 0 && targetIndex <= interview.currentQuestionIndex) {
          interview.currentQuestionIndex = targetIndex;
          const targetQ = INTERVIEW_QUESTIONS[targetIndex];
          const goBackResponse = `Got it! Let's fix your "${fieldMatch[1].trim()}" answer. ✏️\n\n${targetQ.question}`;

          interview.messages.push({ role: 'assistant', content: goBackResponse });
          activeInterviews.set(interviewId, interview);

          return res.json({
            message: goBackResponse,
            isComplete: false,
            interviewId,
            isCorrection: true,
            backToQuestion: targetIndex
          });
        }
      }
    }

    const isCorrection = correctionPatterns.some(p => p.test(message.trim()));

    if (isCorrection) {
      // Don't advance — allow user to re-answer current question
      const correctionResponse = [
        `No worries! 😊 Let me give you a chance to correct that.\n\nPlease re-enter your answer for the current question:\n\n_${currentQuestion?.question}_`,
        `Oops, let's fix that! 🔄 No problem at all.\n\nGo ahead and type your corrected answer:\n\n_${currentQuestion?.question}_`,
        `Sure thing! Let's redo this one. ✏️\n\nPlease type your updated answer here:\n\n_${currentQuestion?.question}_`,
      ][Math.floor(Math.random() * 3)];

      interview.messages.push({ role: 'assistant', content: correctionResponse });
      activeInterviews.set(interviewId, interview);

      return res.json({
        message: correctionResponse,
        isComplete: false,
        interviewId,
        isCorrection: true
      });
    }

    // Save answer (only if not a correction)
    if (currentQuestion && currentQuestion.field !== 'photoReminder' && currentQuestion.field !== 'complete') {
      interview.answers[currentQuestion.field] = message;
    }

    // Move to next question
    interview.currentQuestionIndex++;

    // Check if interview is complete or reaching the final message
    const nextQuestion = INTERVIEW_QUESTIONS[interview.currentQuestionIndex];
    const isComplete = interview.currentQuestionIndex >= INTERVIEW_QUESTIONS.length ||
                       (nextQuestion && nextQuestion.field === 'complete');

    // Generate acknowledgment for the user's answer
    function getAcknowledgment(field, answer) {
      // Handle photo upload
      if (field === 'photoReminder' || (answer && answer.includes('Photo uploaded'))) {
        return '📸 Your profile photo has been saved successfully! It will look great on your spotlight poster.';
      }
      const short = (answer || '').length < 50;
      const long = (answer || '').length > 200;

      const acknowledgments = {
        name: [
          `Wonderful to meet you, ${answer}! 😊`,
          `What a lovely name, ${answer}! ✨`,
          `Great to have you here, ${answer}! 👋`,
        ],
        companyId: [
          `Got it — thanks for confirming! ✅`,
          `Recorded your company ID. Thanks! 📝`,
        ],
        joinTime: [
          `That's great, you've been part of the Whale Cloud family since ${answer}! 🐋`,
          `${answer} — so you've had quite a journey with us! 🚀`,
        ],
        team: [
          `The ${answer} team sounds like an exciting place! 🎯`,
          `Working in ${answer} — that's fantastic! 💪`,
        ],
        position: [
          `${answer} — impactful role! Let me learn more about what you do. 🔍`,
          `That's a key position! Thanks for sharing. ⭐`,
        ],
        currentRole: [
          long ? `Really insightful description of your role! I can see you're deeply involved in meaningful work. 💼` : `Thanks for sharing what you do! Let's dive deeper. 💼`,
          `I appreciate the details about your day-to-day — gives me a clear picture! 🌟`,
        ],
        motto: [
          long ? `What an inspiring motto! It really gives a sense of your drive and values. 💭` : `Great motto — short and meaningful! 💭`,
          `I love that guiding principle! It says a lot about your approach. ✨`,
        ],
        projects: [
          long ? `Those projects sound impressive and impactful! Thank you for the detailed rundown. 🚀` : `Exciting projects! Let's hear about your proudest moment next. 🚀`,
          `Thanks for walking me through your work — it sounds like you're making real contributions! 👏`,
        ],
        achievement: [
          long ? `Wow, what an incredible achievement! The way you described the challenge, approach, and impact is truly inspiring. 🏆` : `That's a remarkable achievement — you should be proud! 🏆`,
          `What a story of perseverance and success! This is exactly the kind of impact we love to spotlight. 🌟`,
        ],
        contributions: [
          long ? `That's a powerful example of stepping up when it mattered most. Your contribution clearly made a difference! 💪` : `Thank you for sharing that — every contribution counts! 💪`,
          `I can see why you were nominated — that kind of dedication sets a great example. 🔥`,
        ],
        culture: [
          long ? `Beautiful perspective on our culture! Your insights about Whale Cloud are exactly what makes this series special. 🌟` : `I appreciate your take on our culture — it's what makes Whale Cloud unique! 🌊`,
          `Your thoughts on the company culture really resonate. Thank you for sharing so openly! 💙`,
        ],
        crossCultural: [
          long ? `What a fascinating cross-cultural experience! You navigated those challenges brilliantly — that's a skill many people never develop. 🌍` : `Cross-cultural collaboration is never easy, and your experience shows real adaptability! 🌍`,
          `These cross-cultural stories are so valuable — thank you for sharing your journey! 🤝`,
        ],
        aiUsage: [
          long ? `Fantastic overview of your AI toolkit! It's inspiring to see how you're embracing new technologies to work smarter. 🤖` : `Great to hear how you're using AI! Every efficiency gain counts. ⚡`,
          `Your AI adoption approach is forward-thinking — thanks for the specifics! 🚀`,
        ],
        aiPerspective: [
          long ? `Brilliant analysis! Your perspective on AI's impact and the quantifiable gains really paint a clear picture of the future. ⚡` : `Sharp insight on AI's role! The numbers speak volumes. 📊`,
          `I love how you've thought about this — AI is clearly a game-changer in your field. 💡`,
        ],
        lessons: [
          long ? `These are such valuable lessons! The depth of your reflection shows real growth during your time here. 📚` : `Powerful lessons learned — each one tells a story of growth. 🌱`,
          `Thank you for sharing those insights — wisdom earned through experience is the best kind. 💎`,
        ],
        advice: [
          long ? `Outstanding advice! I'm sure new team members would benefit immensely from these words of wisdom. 💡` : `Great advice — sometimes the simplest guidance is the most powerful! ✨`,
          `That's the kind of mentorship that builds a strong team culture. Thank you! 🙏`,
        ],
        openEnded: [
          `Thank you for sharing even more of your journey with me — it's been wonderful hearing your full story! 🌈`,
          `I really appreciate you opening up about this. Every story adds depth to our Whale Spotlight! 💙`,
        ]
      };

      const options = acknowledgments[field] || [
        `Thanks for sharing that! 😊`,
        `Wonderful, I appreciate your response! ✨`,
        `Great answer — let's continue! 👍`,
      ];
      return options[Math.floor(Math.random() * options.length)];
    }

    // Generate transition hint based on current and next field
    function getTransitionHint(currentField, nextField) {
      const transitions = {
        'name|companyId': 'Now, I just need a few more details from you.',
        'companyId|joinTime': '',
        'joinTime|team': 'Let me learn about where you fit in our organization.',
        'team|position': '',
        'position|currentRole': "I'm curious about the details of your work.",
        'currentRole|motto': "That gives me a great picture of your role. Now let's get a bit more personal! 🎯",
        'motto|photoReminder': "A motto says so much about who you are. Now, let's add a visual element! 🎨",
        'photoReminder|projects': "Photo is all set! Now let's dive into the exciting part — your work and impact.",
        'projects|achievement': "Great projects! Now I'd love to zoom in on something you're especially proud of.",
        'achievement|contributions': "That's a highlight worth celebrating! Let's talk about another impactful moment.",
        'contributions|culture': "Your contributions speak volumes. Now I'd like to hear your thoughts on our workplace culture.",
        'culture|crossCultural': "Culture shapes everything. Speaking of which, let's talk about working across borders.",
        'crossCultural|aiUsage': "Cross-cultural skills are invaluable. Now, a topic that's reshaping everyone's work — AI!",
        'aiUsage|aiPerspective': "You're clearly embracing AI! Let me ask you to zoom out and share the bigger picture.",
        'aiPerspective|lessons': "Fascinating perspective on AI! Now let's reflect on the lessons your Whale Cloud journey has taught you.",
        'lessons|advice': "Those are lessons worth their weight in gold. Now, what would you tell others starting their journey?",
        'advice|openEnded': "Wonderful advice — I'm sure many will benefit from it. One more open question before we wrap up!",
        'openEnded|complete': "Thank you for those final thoughts. It's been an incredible conversation! 🎉",
      };

      const key = `${currentField}|${nextField}`;
      return transitions[key] || '';
    }

    let aiMessage = '';
    let isReallyComplete = false;

    if (isComplete) {
      isReallyComplete = true;
      if (nextQuestion && nextQuestion.field === 'complete') {
        aiMessage = nextQuestion.question;
      } else {
        aiMessage = "Thank you so much for sharing your wonderful story with me! 🎉\n\nI've learned so much about your journey at Whale Cloud, and I'm excited to generate your personalized Whale Spotlight content. It's been such a pleasure learning about your experiences! 💙";
      }

      // Add closing message
      interview.messages.push({ role: 'assistant', content: aiMessage });
      activeInterviews.set(interviewId, interview);

      // Save interview with all messages
      saveInterview(interview);

      res.json({
        message: aiMessage,
        isComplete: true,
        interviewId,
        autoGeneratePoster: true,
        needsSave: true
      });
    } else {
      // Build natural transition with acknowledgment + hint + next question
      const ack = getAcknowledgment(currentQuestion.field, message);
      const hint = getTransitionHint(currentQuestion.field, nextQuestion.field);
      const nextQ = nextQuestion.question;

      aiMessage = `${ack}${hint ? '\n\n' + hint + '\n\n' : '\n\n'}${nextQ}`;
      interview.messages.push({ role: 'assistant', content: aiMessage });
      activeInterviews.set(interviewId, interview);

      res.json({
        message: aiMessage,
        isComplete: false,
        interviewId
      });
    }
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
    // Strip large base64 photo data from messages to keep JSON small
    const cleanInterview = { ...interview };
    if (cleanInterview.profilePhoto && !cleanInterview.profilePhoto.startsWith('/api/photo/')) {
      delete cleanInterview.profilePhoto;
    }

    const filePath = path.join(DATA_DIR, `${interview.id}.json`);
    const dataToSave = {
      ...cleanInterview,
      timestamp: interview.createdAt,
      name: interview.answers.name || 'Anonymous',
      companyId: interview.answers.companyId || 'N/A',
      joinTime: interview.answers.joinTime || 'N/A',
      team: interview.answers.team || 'N/A',
      position: interview.answers.position || 'N/A',
      currentRole: interview.answers.currentRole || 'N/A'
    };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));

    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`✅ Interview saved: ${interview.id} - ${dataToSave.name} (${fileSize} KB)`);
  } catch (error) {
    console.error('❌ Error saving interview:', error);
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
    let deleted = false;

    // Delete interview JSON
    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
      console.log(`🗑️  Deleted interview: ${id}`);
    }

    // Delete photo files
    ['jpg', 'png', 'jpeg'].forEach(ext => {
      const photoPath = path.join(PHOTOS_DIR, `${id}.${ext}`);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log(`🗑️  Deleted photo: ${id}.${ext}`);
      }
    });

    if (deleted) {
      res.json({ message: 'Interview deleted successfully' });
    } else {
      res.status(404).json({ error: 'Interview not found' });
    }
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

// Serve profile photos
app.get('/api/photo/:id', (req, res) => {
  try {
    const { id } = req.params;
    // Check for jpg first, then png
    let photoPath = path.join(PHOTOS_DIR, `${id}.jpg`);
    if (!fs.existsSync(photoPath)) {
      photoPath = path.join(PHOTOS_DIR, `${id}.png`);
    }
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    const ext = path.extname(photoPath).slice(1);
    res.setHeader('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`);
    res.sendFile(photoPath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load photo' });
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
