# 🚀 Quick Start Guide

Get the Employee Culture Platform running in 5 minutes!

## ⚡ Prerequisites

- **Node.js 18+** (Check: `node --version`)
- **npm** (Check: `npm --version`)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

## 📦 Installation

### 1. Navigate to Project Directory
```bash
cd employee-culture-platform
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages for both frontend and backend.

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
PORT=5000
```

⚠️ **Important:** Replace `sk-your-actual-openai-key-here` with your real API key from OpenAI.

## 🎮 Running the Application

### Option 1: Run Both Servers (Recommended)

**Terminal 1 - Start Backend:**
```bash
npm run server
```

You should see:
```
🚀 Server running on http://localhost:5000
📊 API endpoints:
   - POST /api/interview/chat
   - POST /api/interview/generate-summary
   - POST /api/persona/initialize
   - POST /api/persona/chat
   - GET  /api/health
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in 300 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Option 2: One-Line Start (Optional)

If you prefer, add this to `package.json`:

```json
{
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run dev\""
  }
}
```

Then install concurrently:
```bash
npm install --save-dev concurrently
```

And run:
```bash
npm start
```

## 🌐 Access the Application

Open your browser and navigate to:

**http://localhost:3000**

You should see the Employee Culture Platform landing page with three tabs:
1. **AI Interview Bot** 🤖
2. **Poster Generator** 🎨
3. **Digital Persona** 👤

## ✅ Verify Everything Works

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T10:30:00.000Z"
}
```

### Test Frontend
1. Navigate to **AI Interview Bot** tab
2. Type a message: "My name is John"
3. Hit Send ✉️
4. The AI should respond with the next question

If you see the AI response, everything is working! 🎉

## 📱 Using the Platform

### Step 1: Conduct an Interview
1. Go to **AI Interview Bot** tab
2. Answer the AI's questions naturally
3. Wait for the summary to generate on the right panel
4. Download the JSON if needed

### Step 2: Generate a Poster
1. Switch to **Poster Generator** tab
2. Select a template style
3. Upload a photo (optional)
4. Choose language (English/中文)
5. Click **Export Poster** to download

### Step 3: Chat with Digital Persona
1. Go to **Digital Persona** tab
2. View the employee profile on the left
3. Ask questions about their work experience
4. Get responses in their voice!

## 🐛 Troubleshooting

### Problem: "Cannot connect to server"

**Solution:**
1. Make sure backend is running on port 5000
2. Check if another process is using port 5000:
   ```bash
   lsof -i :5000
   ```
3. Kill the process or change the port in `.env`

### Problem: "OpenAI API error"

**Solutions:**
1. Verify your API key is correct in `.env`
2. Check your OpenAI account has credits: https://platform.openai.com/usage
3. Make sure your key has access to GPT-4 (or change to GPT-3.5 in `server/index.js`)

### Problem: "Module not found"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Port already in use

**Solution:**

For port 3000:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

For port 5000:
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

Or change ports in `.env` and `vite.config.js`.

### Problem: Poster export not working

**Solutions:**
1. Try a different browser (Chrome or Firefox work best)
2. Check browser console for errors (F12)
3. Make sure html2canvas is installed:
   ```bash
   npm list html2canvas
   ```

## 🔑 Getting an OpenAI API Key

1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Navigate to https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-`)
6. Paste it in your `.env` file

⚠️ **Note:** GPT-4 access may require a paid account. If you get errors, you can change the model to `gpt-3.5-turbo` in `server/index.js`:

```javascript
// Change this line:
model: 'gpt-4',

// To this:
model: 'gpt-3.5-turbo',
```

## 📊 System Requirements

### Minimum
- **CPU:** Dual-core 2.0 GHz
- **RAM:** 4 GB
- **Disk:** 500 MB free space
- **Network:** Stable internet connection (for OpenAI API)

### Recommended
- **CPU:** Quad-core 2.5 GHz+
- **RAM:** 8 GB+
- **Disk:** 1 GB free space
- **Network:** Broadband connection

## 🎯 Next Steps

Now that you're up and running:

1. **Explore the Features:** Try all three modules
2. **Read the Documentation:** Check [README.md](README.md) for detailed info
3. **Review Technical Guide:** See [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) for architecture
4. **Customize:** Modify templates, prompts, or add new features
5. **Deploy:** Follow deployment guide in README for production

## 💡 Pro Tips

1. **Save Time:** Keep both terminal windows open during development
2. **Hot Reload:** Frontend auto-reloads on code changes
3. **Test Early:** Verify OpenAI API access before building features
4. **Export Data:** Download interview summaries before closing browser
5. **Backup Keys:** Store API keys in a password manager

## 🆘 Still Need Help?

- **Check Logs:** Look at terminal output for error messages
- **Browser Console:** Press F12 to see frontend errors
- **Review Docs:** Read README.md and TECHNICAL_GUIDE.md
- **Test Endpoints:** Use curl or Postman to test API directly
- **GitHub Issues:** Report bugs and request features

## 🎉 Success Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with OpenAI key
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] AI responds to messages
- [ ] Interview summary generates
- [ ] Poster exports successfully
- [ ] Digital persona responds

If all boxes are checked, you're ready to go! 🚀

---

**Time to Complete:** ~5 minutes  
**Difficulty:** Beginner-friendly  
**Support:** See README.md for detailed help
