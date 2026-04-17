# 📐 Technical Architecture & Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Component Breakdown](#component-breakdown)
5. [Data Flow](#data-flow)
6. [AI Integration](#ai-integration)
7. [API Specifications](#api-specifications)
8. [State Management](#state-management)
9. [Deployment Strategy](#deployment-strategy)

---

## System Overview

The Employee Culture Platform is a Single Page Application (SPA) that leverages AI to create an end-to-end employee storytelling experience. The system consists of three interconnected modules that share data through a centralized state management system.

### Core Principles
- **Single Source of Truth**: Interview data flows unidirectionally
- **Progressive Enhancement**: Each module builds upon previous data
- **AI-First Design**: All interactions powered by OpenAI GPT-4
- **User Experience**: Minimal friction, maximum output

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
│                         http://localhost:3000                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Interview Bot  │  │ Poster Generator│  │ Digital Persona │ │
│  │                 │  │                 │  │                 │ │
│  │  - Chat UI      │  │  - Templates    │  │  - Profile View │ │
│  │  - Questions    │  │  - Photo Upload │  │  - Chat Interface│ │
│  │  - Summary View │  │  - Export PNG   │  │  - RAG Queries  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │           │
│           └────────────────────┼─────────────────────┘           │
│                                │                                 │
│                    ┌───────────▼───────────┐                    │
│                    │   App State Manager    │                    │
│                    │  (interviewData prop)  │                    │
│                    └───────────┬───────────┘                    │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                        HTTP/REST │ (axios)
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                    BACKEND API (Express + Node.js)               │
│                       http://localhost:5000                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │                                                            │  │
│  │  /api/interview/chat          - Process chat messages     │  │
│  │  /api/interview/generate-summary - Create JSON summary    │  │
│  │  /api/persona/initialize      - Setup knowledge base      │  │
│  │  /api/persona/chat            - Persona conversations     │  │
│  │  /api/health                  - Health check              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AI Integration Layer                         │  │
│  │                                                            │  │
│  │  - System Prompt Engineering                              │  │
│  │  - Conversation Context Management                        │  │
│  │  - Response Parsing & Validation                          │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                  OpenAI API │ (GPT-4)
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      OpenAI GPT-4 API                            │
│                                                                   │
│  - Interview Conversation (Chat Completion)                      │
│  - Summary Generation (Structured JSON)                          │
│  - Persona Responses (Character Consistency)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
```javascript
{
  "framework": "React 18.2",
  "buildTool": "Vite 5.0",
  "styling": "CSS Modules + Custom CSS",
  "icons": "Lucide React",
  "http": "Axios",
  "imageExport": "html2canvas",
  "bundleSize": "~200KB (gzipped)"
}
```

### Backend
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Express 4.18",
  "ai": "OpenAI SDK 4.28",
  "cors": "CORS middleware",
  "env": "dotenv"
}
```

---

## Component Breakdown

### 1. App.jsx (Main Container)

**Responsibilities:**
- Tab navigation state management
- Interview data state (shared across modules)
- Route rendering based on active tab

**Key State:**
```javascript
const [activeTab, setActiveTab] = useState('interview');
const [interviewData, setInterviewData] = useState(null);
```

**Data Flow:**
```
Interview Bot → onInterviewComplete(data) → App.setInterviewData
                                          ↓
                                    Poster Generator (props)
                                    Digital Persona (props)
```

### 2. InterviewBot.jsx

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Chat Section (60%)    │ Summary Section (40%)│
├───────────────────────┼──────────────────────┤
│ - Header              │ - Header + Download  │
│ - Messages scroll     │ - Summary blocks     │
│ - Input + Send        │   * Basic Info       │
│                       │   * Quotes           │
│                       │   * Story            │
│                       │   * Tags             │
└───────────────────────┴──────────────────────┘
```

**State Management:**
```javascript
{
  messages: [],              // Chat history for UI
  conversationHistory: [],   // Clean history for API
  input: '',                 // Current input
  loading: false,            // Request in progress
  interviewSummary: null     // Generated summary
}
```

**API Integration:**
1. **Chat Flow:**
   - User types → Send button
   - POST `/api/interview/chat` with conversation history
   - Receive response + `interviewComplete` flag
   - Update UI with assistant message

2. **Summary Generation:**
   - Triggered when `interviewComplete === true`
   - POST `/api/interview/generate-summary`
   - Parse JSON response
   - Display structured summary
   - Call `onInterviewComplete(summary)` to propagate data

### 3. PosterGenerator.jsx

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Control Panel (400px) │ Preview Panel (flex)│
├───────────────────────┼──────────────────────┤
│ - Template selector   │ - Live poster preview│
│ - Language toggle     │ - Real-time updates  │
│ - Photo upload        │ - Export ready       │
│ - Quote navigation    │                      │
│ - Export button       │                      │
└───────────────────────┴──────────────────────┘
```

**State Management:**
```javascript
{
  template: 'international',  // Template style
  language: 'en',             // en | zh
  photo: null,                // Base64 image data
  selectedQuote: 0            // Quote index
}
```

**Export Flow:**
```javascript
// html2canvas captures the poster div
const canvas = await html2canvas(posterRef.current, {
  scale: 2,                    // High resolution
  backgroundColor: null,        // Transparent
  logging: false
});

// Convert to downloadable image
const dataUrl = canvas.toDataURL('image/png');
// Trigger download
```

**Template System:**
```javascript
const templates = {
  international: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif',
    textColor: 'white'
  },
  // ... more templates
};

// Applied dynamically:
<div style={{
  background: templates[template].gradient,
  fontFamily: templates[template].fontFamily
}}>
```

### 4. DigitalPersona.jsx

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ Profile Panel (350px) │ Chat Panel (flex)   │
├───────────────────────┼──────────────────────┤
│ - Avatar + Badge      │ - Header + Status    │
│ - Employee details    │ - Message history    │
│ - Stats grid          │ - Suggestions        │
│ - Motto               │ - Input + Send       │
│ - Tags                │                      │
│ - About               │                      │
└───────────────────────┴──────────────────────┘
```

**State Management:**
```javascript
{
  messages: [],              // Chat UI messages
  input: '',                 // Current input
  loading: false,            // Request state
  isInitialized: false       // Persona ready
}
```

**Initialization Flow:**
```
Component Mount → useEffect
                     ↓
           POST /api/persona/initialize
           (sends interviewData)
                     ↓
           Server stores in knowledge base
                     ↓
           Welcome message displayed
           isInitialized = true
```

**Chat Flow:**
```
User sends message
        ↓
POST /api/persona/chat
  {
    message: userInput,
    conversationHistory: last10Messages,
    interviewData: fullData
  }
        ↓
Server constructs persona prompt
        ↓
OpenAI responds in character
        ↓
Display response in UI
```

---

## Data Flow

### Interview Data Structure

```typescript
interface InterviewSummary {
  basicInfo: {
    name: string;
    employeeId: string;
    jobTitle: string;
    team: string;
    nationality: string;
    joinTime: string;
    personalMotto?: string;
  };
  highlightedQuotes: string[];
  personalStory: string;
  culturalInsights: string;
  workPhilosophy: string;
  aiUsage: string;
  keyTags: string[];
  summary: string;
}
```

### State Propagation

```
┌──────────────────┐
│  InterviewBot    │
│  generates data  │
└────────┬─────────┘
         │
         │ onInterviewComplete(data)
         ↓
┌────────────────────┐
│   App.jsx          │
│   setInterviewData │
└───────┬────────────┘
        │
        ├─────────────────────┐
        │                     │
        ↓                     ↓
┌───────────────┐   ┌──────────────────┐
│PosterGenerator│   │ DigitalPersona   │
│  props.data   │   │   props.data     │
└───────────────┘   └──────────────────┘
```

---

## AI Integration

### 1. Interview System Prompt

**Purpose:** Guide the AI to conduct structured interviews

**Key Components:**
```
1. Role Definition
   - "You are an AI Culture Reporter"
   
2. Information Checklist
   - Basic info (name, ID, title, team, etc.)
   - Role-specific questions
   
3. Conversation Style
   - Ask one question at a time
   - Be conversational and friendly
   - Don't repeat questions
   
4. Completion Signal
   - After 8-10 meaningful exchanges
   - Set interviewComplete flag
```

### 2. Summary Generation Prompt

**Purpose:** Extract structured data from conversation

**Approach:**
```
1. Input: Full conversation history
2. Task: Extract information into JSON schema
3. Output: Validated JSON object
4. Validation: Parse JSON, handle errors
```

**JSON Schema Enforcement:**
```javascript
const summaryPrompt = `
Generate a JSON object with these exact fields:
{
  "basicInfo": { ... },
  "highlightedQuotes": [...],
  ...
}

Return ONLY valid JSON, no additional text.
`;
```

### 3. Digital Persona Prompt

**Purpose:** Create authentic employee voice

**Construction:**
```javascript
const systemPrompt = `
You are ${name}, a ${title} at ${team}.

[Include all interview data]

INSTRUCTIONS:
1. Respond in first person
2. Use interview data to answer
3. Be natural and conversational
4. Stay in character
`;
```

**Context Management:**
```javascript
// Keep last 10 messages for context
const contextMessages = conversationHistory.slice(-10);

// Full conversation structure:
[
  { role: 'system', content: personaPrompt },
  ...contextMessages
]
```

---

## API Specifications

### POST /api/interview/chat

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "My name is John" }
  ],
  "conversationHistory": [
    { "role": "user", "content": "My name is John" }
  ]
}
```

**Response:**
```json
{
  "message": "Great to meet you, John! What's your employee ID?",
  "interviewComplete": false
}
```

### POST /api/interview/generate-summary

**Request:**
```json
{
  "conversationHistory": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "summary": {
    "basicInfo": { ... },
    "highlightedQuotes": [...],
    ...
  }
}
```

### POST /api/persona/initialize

**Request:**
```json
{
  "interviewData": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "personaId": "EMP001"
}
```

### POST /api/persona/chat

**Request:**
```json
{
  "message": "What's your biggest achievement?",
  "conversationHistory": [...],
  "interviewData": { ... }
}
```

**Response:**
```json
{
  "message": "My biggest achievement was leading the Platform migration project..."
}
```

---

## State Management

### Approach: Prop Drilling + Component State

**Why This Approach?**
- Simple application structure
- Clear data flow
- No external dependencies
- Easy to debug

**State Hierarchy:**
```
App (root state)
├─ activeTab: string
└─ interviewData: InterviewSummary | null
   │
   ├─→ InterviewBot (sets via callback)
   ├─→ PosterGenerator (reads via props)
   └─→ DigitalPersona (reads via props)
```

**For Larger Apps:**
Consider migrating to:
- **Context API**: For 5+ components needing shared state
- **Redux**: For complex state logic
- **Zustand**: For lightweight global state

---

## Deployment Strategy

### Development Environment

```bash
# Terminal 1 - Backend
cd employee-culture-platform
npm run server

# Terminal 2 - Frontend
npm run dev
```

### Production Build

**Frontend (Static Hosting):**
```bash
npm run build
# Output: dist/ folder

# Deploy to:
- Vercel: vercel deploy
- Netlify: netlify deploy --prod
- AWS S3: aws s3 sync dist/ s3://bucket-name
```

**Backend (Server Hosting):**
```bash
# Deploy to:
- Heroku: git push heroku main
- Railway: railway up
- Render: Connect GitHub repo
- AWS EC2: pm2 start server/index.js
```

### Environment Variables

**Production Backend:**
```env
OPENAI_API_KEY=sk-prod-key-here
PORT=5000
NODE_ENV=production
```

**Frontend Build:**
- Update API endpoint in production build
- Use environment-specific proxy configuration

### Docker Deployment (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
EXPOSE 3000

CMD ["npm", "start"]
```

---

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy load components
- **Image Optimization**: Compress uploaded photos
- **Memoization**: Use React.memo for poster preview
- **Debouncing**: Debounce search/filter inputs

### Backend Optimization
- **Rate Limiting**: Prevent API abuse
- **Caching**: Cache frequently accessed data
- **Connection Pooling**: Reuse HTTP connections
- **Request Queuing**: Manage concurrent AI requests

### AI Cost Management
- **Token Limits**: Set max_tokens appropriately
- **Context Pruning**: Only send relevant history
- **Model Selection**: Use GPT-3.5 for simple tasks
- **Caching**: Cache similar prompts

---

## Testing Strategy

### Unit Tests
```javascript
// Example: Test interview data validation
describe('Interview Summary', () => {
  it('should have all required fields', () => {
    expect(summary).toHaveProperty('basicInfo');
    expect(summary).toHaveProperty('highlightedQuotes');
  });
});
```

### Integration Tests
```javascript
// Example: Test API endpoints
describe('POST /api/interview/chat', () => {
  it('should return a message', async () => {
    const response = await request(app)
      .post('/api/interview/chat')
      .send({ messages: [...] });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});
```

### E2E Tests (Playwright/Cypress)
```javascript
// Example: Complete interview flow
test('Complete interview and generate poster', async () => {
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="interview-tab"]');
  // ... interact with UI
  await page.click('[data-testid="poster-tab"]');
  // ... verify poster rendered
});
```

---

## Security Best Practices

1. **API Key Protection**
   - Never expose in frontend code
   - Use server-side only
   - Rotate keys regularly

2. **Input Sanitization**
   - Validate all user inputs
   - Prevent XSS attacks
   - Limit message length

3. **Rate Limiting**
   - Implement per-IP limits
   - Prevent DoS attacks
   - Use express-rate-limit

4. **CORS Configuration**
   - Whitelist specific origins in production
   - Don't use wildcard (*) in prod

5. **HTTPS Only**
   - Force HTTPS in production
   - Use secure cookies
   - Enable HSTS header

---

## Monitoring & Analytics

### Recommended Tools

**Performance Monitoring:**
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **New Relic**: APM

**Analytics:**
- **Google Analytics**: User behavior
- **Mixpanel**: Event tracking
- **Amplitude**: Product analytics

**Custom Metrics:**
```javascript
// Track AI usage
{
  interviewsCompleted: 0,
  postersGenerated: 0,
  personaChats: 0,
  averageInterviewLength: 0,
  tokensUsed: 0
}
```

---

## Troubleshooting Guide

### Common Issues

**Issue: OpenAI Rate Limit**
```
Solution: Implement exponential backoff
- Catch rate limit errors
- Wait and retry with increasing delays
- Show user-friendly message
```

**Issue: Large Poster Export Fails**
```
Solution: Optimize html2canvas
- Reduce scale from 2 to 1.5
- Compress images before upload
- Use smaller canvas dimensions
```

**Issue: Persona Responses Off-Character**
```
Solution: Improve system prompt
- Add more context from interview
- Include tone/style examples
- Adjust temperature (0.5-0.8)
```

---

## Future Enhancements

### Phase 1: Core Improvements
- [ ] Add authentication (JWT)
- [ ] Implement user accounts
- [ ] Add interview templates
- [ ] Multi-language support

### Phase 2: Advanced Features
- [ ] Voice interview option
- [ ] Video integration
- [ ] Team analytics dashboard
- [ ] Advanced RAG with Pinecone

### Phase 3: Enterprise
- [ ] SSO integration
- [ ] HR system connectors
- [ ] Advanced reporting
- [ ] White-label options

---

## Conclusion

This platform demonstrates a modern, AI-powered approach to employee engagement and cultural documentation. The architecture is designed to be:

- **Scalable**: Can handle thousands of interviews
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features
- **User-Friendly**: Intuitive interface design

For questions or contributions, please refer to the main README.md file.

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-04-07  
**Author:** Technical Team
