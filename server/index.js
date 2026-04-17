import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
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

// Admin password - 生产环境应该使用环境变量
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'whale2026';

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN,
  baseURL: process.env.ANTHROPIC_BASE_URL
});

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Data storage directory
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory storage for active interviews
const activeInterviews = new Map();

// Enhanced system prompt based on reference materials
const INTERVIEWER_PROMPT = `You are a professional AI interviewer for Whale Cloud Technology, conducting employee culture spotlight interviews. Your goal is to gather comprehensive information through natural, engaging conversation.

REQUIRED INFORMATION TO COLLECT:
1. Basic Information:
   - Full Name
   - Company ID
   - Join Time (when they joined Whale Cloud)
   - Team/Department
   - Position/Job Title
   - Current Role description
   - Personal Motto (life philosophy or guiding principle)

2. Professional Experience:
   - Main projects they're involved in
   - Most proud achievement or project
   - Specific contributions and impact
   - Key responsibilities

3. Cultural & Collaboration:
   - View on company culture
   - Cross-cultural collaboration experiences
   - Challenges faced working with international teams
   - How they handle coordination across time zones

4. AI Integration:
   - Current AI usage in daily work
   - Perspective on AI in their role
   - How AI has influenced their efficiency
   - Biggest changes noticed from AI adoption

5. Experience Sharing:
   - Professional growth journey
   - Valuable lessons learned
   - Advice for team members
   - Best practices worth sharing

INTERVIEW STYLE:
- Professional yet personable - avoid being robotic
- Ask ONE question at a time
- Listen carefully and ask intelligent follow-up questions
- Show genuine interest in their stories
- Adapt questions based on their role (junior vs senior, technical vs business)
- Dig deeper into interesting points - get specific examples
- Be conversational but maintain professionalism

QUESTION EXAMPLES (adapt based on role):
- "Could you briefly introduce when you joined Whale Cloud and the type of work you are mainly involved in today?"
- "Which project or achievement are you most proud of, and what impact did it have?"
- "Can you share a situation where urgent support was needed, and how you helped resolve it?"
- "What challenges have you encountered in cross-cultural collaboration, and how did you handle them?"
- "How has AI influenced your daily work? What changes have you noticed?"

PROGRESSION:
1. Start with warm introduction and basic info (name, role, team)
2. Move to professional experience and achievements
3. Explore collaboration and cultural insights
4. Discuss AI impact and perspectives
5. After 12-15 meaningful exchanges covering all key areas, naturally conclude

COMPLETION SIGNAL:
When you have collected sufficient detailed information across all areas, say:
"Thank you so much for sharing these valuable insights! I have all the information I need for your Whale Cloud spotlight feature. Your interview is now complete."

IMPORTANT:
- Keep questions open-ended to encourage detailed responses
- Get specific examples and stories, not just general statements
- If they give brief answers, ask follow-up questions
- Maintain natural conversation flow
- Don't ask multiple questions at once`;

// Generate poster content prompt based on reference samples
const POSTER_GENERATION_PROMPT = `You are a professional copywriter creating content for Whale Cloud's "Employee Spotlight" series. Based on the interview transcript, generate polished, professional content in the exact style of the reference samples.

REQUIRED OUTPUT FORMAT (JSON):
{
  "title": "Whale Spotlight 2026 – [Month]: [Full Name]",
  "motto": "[Personal motto from interview]",
  "introduction": "[2-3 paragraph professional introduction covering: role, main responsibilities, collaboration style, and team contribution. Style: professional, warm, appreciative. End with: 'We truly appreciate [his/her] [key qualities].']",
  "achievement": "[Detailed paragraph about their proudest project/achievement. Include: context, challenges, their specific contribution, and impact. Be specific with technical/business details.]",
  "qa_session": [
    {
      "question": "[Thoughtful question based on their experience]",
      "answer": "[Detailed answer showcasing their expertise and approach]"
    },
    {
      "question": "[Second thoughtful question on different topic]",
      "answer": "[Detailed answer revealing insights]"
    }
  ],
  "ai_insight": "[Paragraph about their AI usage and perspective. Include: how they use AI, benefits observed, challenges if any, and their philosophy on AI as assistant vs replacement. Style: thoughtful, balanced, forward-looking.]",
  "basic_info": {
    "name": "[Full Name]",
    "company_id": "[ID]",
    "position": "[Job Title]",
    "month": "[Current month - Jan/Feb/Mar/etc]"
  }
}

STYLE GUIDELINES (based on reference samples):
1. Introduction:
   - Professional tone but warm
   - Highlight role and responsibilities clearly
   - Mention collaboration with teams (local, HQ, international)
   - End with appreciation statement
   - Length: 80-120 words

2. Achievement:
   - Start with "The project [he/she] is most proud of is..."
   - Provide specific project names and context
   - Explain challenges faced
   - Detail their specific contributions
   - Describe the impact (system stability, customer confidence, etc.)
   - Length: 100-150 words

3. Q&A Session:
   - 2 questions that show depth
   - Questions should cover: urgent situations, growth journey, collaboration challenges, or technical approach
   - Answers should be substantial (60-100 words each)
   - Use first person in answers
   - Show both technical competence and soft skills

4. AI Insight:
   - Start with how AI has impacted their work
   - Include specific use cases (log analysis, documentation, troubleshooting, etc.)
   - Mention both benefits and challenges/considerations
   - End with philosophical view on AI as augmentation
   - Length: 80-120 words

TONE:
- Professional yet personable
- Appreciative and respectful
- Specific and concrete (use real examples from interview)
- Balanced (show both achievements and growth)
- Forward-looking and positive

Return ONLY valid JSON with no additional text.`;

// Start new interview
app.post('/api/interview/start', async (req, res) => {
  try {
    const interviewId = uuidv4();

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-4.5-sonnet',
      max_tokens: 400,
      system: INTERVIEWER_PROMPT,
      messages: [
        { role: 'user', content: 'Start the interview. Introduce yourself warmly and ask for their name.' }
      ]
    });

    const initialMessage = response.content[0].text;

    activeInterviews.set(interviewId, {
      id: interviewId,
      messages: [
        { role: 'assistant', content: initialMessage }
      ],
      createdAt: new Date().toISOString(),
      extractedData: {},
      isPublic: true // 标记为公开采访
    });

    res.json({
      interviewId,
      message: initialMessage
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// Continue interview chat
app.post('/api/interview/chat', async (req, res) => {
  try {
    const { interviewId, message } = req.body;

    const interview = activeInterviews.get(interviewId) || {
      id: interviewId,
      messages: [],
      createdAt: new Date().toISOString(),
      extractedData: {},
      isPublic: true
    };

    // Add user message
    interview.messages.push({ role: 'user', content: message });

    // Convert messages to Claude format
    const claudeMessages = interview.messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    // Get AI response
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-4.5-sonnet',
      max_tokens: 400,
      system: INTERVIEWER_PROMPT,
      messages: claudeMessages
    });

    const aiMessage = response.content[0].text;
    interview.messages.push({ role: 'assistant', content: aiMessage });

    // Check if interview is complete
    const isComplete = aiMessage.toLowerCase().includes('interview is now complete') ||
                      aiMessage.toLowerCase().includes('your interview is complete') ||
                      interview.messages.length > 35;

    if (isComplete) {
      // Extract key information
      await extractBasicInfo(interview);
      // Save to file
      saveInterview(interview);
    }

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

// Extract basic information
async function extractBasicInfo(interview) {
  try {
    const transcript = interview.messages
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-4.5-sonnet',
      max_tokens: 300,
      system: 'Extract key information from the interview and return as JSON: name, companyId, position, team, joinTime, motto. Return ONLY valid JSON.',
      messages: [
        { role: 'user', content: transcript }
      ]
    });

    const extracted = JSON.parse(response.content[0].text);
    interview.extractedData = extracted;
    interview.name = extracted.name;
    interview.position = extracted.position;
    interview.team = extracted.team;
  } catch (error) {
    console.error('Error extracting information:', error);
    interview.extractedData = {};
  }
}

// Save interview to file
function saveInterview(interview) {
  const filePath = path.join(DATA_DIR, `${interview.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(interview, null, 2));
}

// Generate poster content using reference style
app.post('/api/interview/generate-poster', async (req, res) => {
  try {
    const { interviewId } = req.body;

    // Load interview
    const filePath = path.join(DATA_DIR, `${interviewId}.json`);
    let interview;

    if (fs.existsSync(filePath)) {
      interview = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      interview = activeInterviews.get(interviewId);
    }

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Generate poster content
    const transcript = interview.messages
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-4.5-sonnet',
      max_tokens: 2000,
      system: POSTER_GENERATION_PROMPT,
      messages: [
        { role: 'user', content: `Interview Transcript:\n\n${transcript}\n\nGenerate the complete poster content in JSON format following the Whale Cloud spotlight style.` }
      ]
    });

    const posterContent = JSON.parse(response.content[0].text);

    // Save poster content
    interview.posterContent = posterContent;
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(interview, null, 2));
    }
    activeInterviews.set(interviewId, interview);

    res.json({ posterContent });
  } catch (error) {
    console.error('Error generating poster:', error);
    res.status(500).json({ error: 'Failed to generate poster content' });
  }
});

// Admin authentication
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-authenticated' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get all interviews (admin only)
app.get('/api/admin/interviews', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin-authenticated') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const interviews = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      return {
        id: data.id,
        name: data.name || data.extractedData?.name || 'Unknown',
        position: data.position || data.extractedData?.position || 'N/A',
        team: data.team || data.extractedData?.team || 'N/A',
        createdAt: data.createdAt,
        messageCount: data.messages?.length || 0,
        isComplete: !!data.posterContent
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ interviews });
  } catch (error) {
    console.error('Error loading interviews:', error);
    res.json({ interviews: [] });
  }
});

// Get single interview details (admin only)
app.get('/api/admin/interview/:interviewId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin-authenticated') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { interviewId } = req.params;
    const filePath = path.join(DATA_DIR, `${interviewId}.json`);

    if (fs.existsSync(filePath)) {
      const interview = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json(interview);
    } else {
      res.status(404).json({ error: 'Interview not found' });
    }
  } catch (error) {
    console.error('Error loading interview:', error);
    res.status(500).json({ error: 'Failed to load interview' });
  }
});

// Download Word document (admin only)
app.get('/api/admin/download/:interviewId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin-authenticated') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { interviewId } = req.params;
    const filePath = path.join(DATA_DIR, `${interviewId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const interview = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const doc = await generateWordDocument(interview);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=whale-spotlight-${interview.name || interviewId}.docx`);

    const buffer = await Packer.toBuffer(doc);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

// Generate Word document with poster content
async function generateWordDocument(interview) {
  const children = [];
  const poster = interview.posterContent;

  if (poster) {
    // Title
    children.push(
      new Paragraph({
        text: poster.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 }
      })
    );

    // Motto
    if (poster.motto) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Motto: ', bold: true }),
            new TextRun({ text: poster.motto, italics: true })
          ],
          spacing: { after: 400 }
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

      poster.qa_session.forEach((qa, idx) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Q${idx + 1}: `, bold: true, color: '667eea' }),
              new TextRun(qa.question)
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `A${idx + 1}: `, bold: true, color: '764ba2' }),
              new TextRun(qa.answer)
            ],
            spacing: { after: 300 }
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
  }

  // Footer
  children.push(
    new Paragraph({
      text: '---',
      spacing: { before: 400, after: 100 }
    }),
    new Paragraph({
      text: 'Whale Cloud Technology - Employee Spotlight Series 2026',
      italics: true
    })
  );

  return new Document({
    sections: [{
      properties: {},
      children
    }]
  });
}

// Delete interview (admin only)
app.delete('/api/admin/interview/:interviewId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer admin-authenticated') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { interviewId } = req.params;
    const filePath = path.join(DATA_DIR, `${interviewId}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    activeInterviews.delete(interviewId);

    res.json({ success: true });
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
    ai: 'Claude 4.5 Sonnet',
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
  console.log(`🤖 AI: ${process.env.ANTHROPIC_MODEL || 'claude-4.5-sonnet'}`);
  console.log(`\n📊 Endpoints:`);
  console.log(`   Public:`);
  console.log(`   - POST /api/interview/start`);
  console.log(`   - POST /api/interview/chat`);
  console.log(`   - POST /api/interview/generate-poster`);
  console.log(`\n   Admin:`);
  console.log(`   - POST /api/admin/login`);
  console.log(`   - GET  /api/admin/interviews`);
  console.log(`   - GET  /api/admin/interview/:id`);
  console.log(`   - GET  /api/admin/download/:id`);
  console.log(`   - DELETE /api/admin/interview/:id\n`);
});
