# SmartEd - YouTube Video Learning Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

SmartEd is a comprehensive YouTube learning assistant that transforms video content into interactive educational experiences. It provides AI-powered summaries, generates quizzes, and offers intelligent Q&A capabilities for any YouTube video.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Frontend Components](#-frontend-components)
- [Browser Extension](#-browser-extension)
- [Usage Guide](#-usage-guide)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Features

### Core Features
- **🎥 Video Content Analysis**: Automatically extracts and analyzes YouTube video content
- **📝 Smart Summaries**: Generates concise, structured summaries of video content
- **🧠 Interactive Quizzes**: Creates multiple-choice questions to test comprehension
- **💬 Video Q&A**: Ask specific questions about video content and get detailed answers
- **🔄 Content Caching**: Efficient caching system for faster subsequent operations
- **🌙 Dark/Light Mode**: Toggle between themes for comfortable viewing

### Advanced Features
- **📱 Responsive Design**: Works seamlessly across desktop and mobile devices
- **🚀 Real-time Processing**: Live content analysis and interaction
- **💾 Local Storage**: Saves results locally for offline access
- **🔗 URL Detection**: Automatically detects YouTube videos and processes them
- **📊 Progress Tracking**: Visual indicators for processing status

### Browser Extension Features
- **🧩 Seamless Integration**: Embeds directly into YouTube's interface
- **🔄 Auto-Navigation**: Automatically adapts to YouTube's single-page app navigation
- **📌 Persistent UI**: Maintains state across page navigations
- **⚡ Fast Loading**: Optimized for quick initialization

## 🏗️ Architecture

### Backend Architecture
```
Backend/
├── main.py          # FastAPI server with all endpoints
├── model.py            # AI processing using Google Gemini API
├── transcript.py     # YouTube transcript extraction
└── requirements.txt  # Python dependencies
```

### Frontend Architecture
```
Frontend/
├── Smarted.jsx  # Main React component
├── content.tsx               # Browser extension content script
├── style.css                  # Styling and themes
└── plasmo.json               # Extension manifest
```

### Data Flow
1. **Content Extraction**: Video URL → Transcript → AI Analysis
2. **Content Caching**: Analyzed content stored for reuse
3. **Feature Generation**: Summary, Quiz, Q&A using cached content
4. **User Interface**: React components display results with real-time updates

## 📋 Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher

### API Keys Required
- **Google Gemini API Key**: For AI-powered content analysis
  - Get your API key from [Google AI Studio](https://aistudio.google.com/)

### Browser Support
- **Chrome**: Version 88+
- **Firefox**: Version 78+
- **Safari**: Version 14+
- **Edge**: Version 88+

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smarted.git
cd smarted
```

### 2. Backend Setup

#### Create Python Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Create requirements.txt (if not exists)
```bash
# Save this as backend/requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0
google-generativeai==0.8.0
youtube-transcript-api==0.6.1
pydantic==2.5.0
```

### 3. Frontend Setup

#### Install Node.js Dependencies
```bash
cd frontend
npm install
```

#### Install Required Packages
```bash
# Core dependencies
npm install react react-dom
npm install @mdxeditor/editor
npm install lucide-react

# Development dependencies
npm install @types/react @types/react-dom
npm install typescript
```

### 4. Browser Extension Setup (using Plasmo)

#### Install Plasmo Framework
```bash
npm install -g plasmo
```

#### Initialize Plasmo Project
```bash
cd frontend
plasmo init
```

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the backend directory:
```env
# Backend/.env
GOOGLE_API_KEY=your_google_gemini_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here  # Alternative name
```

### 2. API Configuration

Edit `backend/model.py` to configure AI models:
```python
# Model configurations
SUMMARY_MODEL = "gemini-2.0-flash"
QUIZ_MODEL = "gemini-2.0-flash"
CHAT_MODEL = "gemini-2.0-flash"
```

### 3. CORS Configuration

Update `backend/main.py` for production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://youtube.com", "https://www.youtube.com"],  # Specify allowed origins
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

## 🏃‍♂️ Running the Application

### 1. Start the Backend Server
```bash
cd backend
python main.py
```

The API server will start at `http://localhost:8000`

### 2. API Health Check
Visit `http://localhost:8000` in your browser to verify the server is running.

### 3. Test API Endpoints
```bash
# Test transcript endpoint
curl -X POST "http://localhost:8000/transcript" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 4. Build Browser Extension
```bash
cd frontend
plasmo build
```

### 5. Load Extension in Browser

#### For Chrome:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `frontend/build` directory

#### For Firefox:
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `frontend/build/manifest.json` file

## 📚 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### 1. Health Check
```http
GET /
```
**Response:**
```json
{
  "status": "online",
  "service": "SmartEd API"
}
```

#### 2. Extract Transcript
```http
POST /transcript
```
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```
**Response:**
```json
{
  "transcript": "Extracted video content..."
}
```

#### 3. Generate Summary
```http
POST /summarize
```
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "max_length": 800
}
```
**Response:**
```json
{
  "summary": "## Video Summary\n\nThis video covers..."
}
```

#### 4. Generate Quiz
```http
POST /quiz
```
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "num_questions": 5
}
```
**Response:**
```json
{
  "quiz": {
    "questions": [
      {
        "question": "What is the main topic?",
        "options": {
          "A": "Option A",
          "B": "Option B",
          "C": "Option C",
          "D": "Option D"
        },
        "correct_answer": "A",
        "explanation": "Explanation here"
      }
    ]
  }
}
```

#### 5. Video Q&A
```http
POST /chat
```
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "question": "What are the main points?"
}
```
**Response:**
```json
{
  "question": "What are the main points?",
  "answer": "The main points are..."
}
```

#### 6. Complete Analysis
```http
POST /complete-analysis
```
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```
**Response:**
```json
{
  "summary": "Video summary...",
  "quiz": { "questions": [...] },
  "cached": true
}
```

#### 7. Preload Content
```http
POST /preload
```
**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```
**Response:**
```json
{
  "message": "Video content preloaded successfully",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "cached": true
}
```

## 🎨 Frontend Components

### Main Component: Smarted
The primary React component that handles all user interactions and API communications.

#### Key Features:
- **Tab-based Interface**: Summary, Quiz, and Chat tabs
- **Real-time Processing**: Live updates during content analysis
- **Theme Support**: Dark/Light mode toggle
- **Responsive Design**: Works on all screen sizes
- **Error Handling**: Comprehensive error messages and retry options

#### State Management:
```javascript
const [results, setResults] = useState({
  summary: '',
  quiz: [],
  videoTitle: '',
  videoId: '',
  thumbnailUrl: ''
});
```

### Content Script: content.tsx
Handles browser extension integration with YouTube.

#### Key Features:
- **YouTube Navigation Detection**: Monitors URL changes
- **DOM Injection**: Inserts extension UI into YouTube pages
- **Cleanup Management**: Removes UI when not on video pages

### Styling: style.css
Comprehensive styling for both light and dark themes.

#### Theme System:
- **CSS Variables**: Consistent color scheme
- **Responsive Design**: Mobile-first approach
- **Smooth Transitions**: Enhanced user experience

## 🔧 Browser Extension

### Manifest Configuration (plasmo.json)
```json
{
  "name": "SmartEd",
  "description": "YouTube video summary and quiz generator",
  "version": "1.0.0",
  "manifest_version": 3,
  "action": {
    "default_title": "SmartEd"
  },
  "content_scripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["content.tsx"]
    }
  ],
  "permissions": ["tabs"],
  "host_permissions": [
    "*://*.youtube.com/*"
  ]
}
```

### Extension Architecture
1. **Content Script**: Runs on YouTube pages
2. **UI Injection**: Inserts SmartEd interface
3. **API Communication**: Connects to backend server
4. **State Persistence**: Maintains data across navigation

## 📖 Usage Guide

### Getting Started
1. **Install the Extension**: Load the built extension into your browser
2. **Navigate to YouTube**: Open any YouTube video
3. **Process Video**: Click "Process This Video" button
4. **Explore Features**: Use Summary, Quiz, and Chat tabs

### Using the Summary Feature
1. Click the "Summary" tab
2. The summary generates automatically after processing
3. Copy the summary using the copy button
4. Switch between light/dark themes as needed

### Using the Quiz Feature
1. Click the "Quiz" tab
2. Answer multiple-choice questions
3. Submit answers to see results
4. Review explanations for incorrect answers
5. Retry questions as needed

### Using the Chat Feature
1. Click the "Chat" tab
2. Type questions about the video content
3. Get detailed answers based on the video
4. Ask follow-up questions for clarification

### Managing the Extension
- **Collapse/Expand**: Use the ▲/▼ button to minimize the interface
- **Theme Toggle**: Switch between light and dark modes
- **Automatic Processing**: The extension detects new videos automatically

## 🔧 Troubleshooting

### Common Issues

#### 1. API Connection Errors
**Problem**: "Error processing video" or connection refused
**Solution**:
- Ensure backend server is running on port 8000
- Check firewall settings
- Verify CORS configuration

#### 2. API Key Issues
**Problem**: "Error extracting video content"
**Solution**:
- Verify Google Gemini API key is correct
- Check API key permissions
- Ensure API key is properly set in `.env` file

#### 3. Extension Not Loading
**Problem**: Extension doesn't appear on YouTube
**Solution**:
- Check browser console for errors
- Verify extension is enabled in browser settings
- Reload the extension and refresh YouTube

#### 4. Transcript Extraction Fails
**Problem**: "Invalid YouTube URL" or transcript errors
**Solution**:
- Ensure video has available captions
- Check video is not private or restricted
- Try with different videos

### Debug Mode
Enable debug logging by adding to `.env`:
```env
DEBUG=true
LOG_LEVEL=debug
```

### Performance Issues
- **Slow Processing**: Videos with long transcripts take more time
- **Memory Usage**: Clear browser cache if extension becomes slow
- **API Limits**: Check Google API usage limits

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/new-feature`
3. **Make Changes**: Implement your feature or fix
4. **Test Changes**: Ensure all tests pass
5. **Submit Pull Request**: Describe your changes clearly

### Development Setup
```bash
# Install development dependencies
cd frontend
npm install --save-dev

# Run in development mode
npm run dev
```

### Code Style
- **Python**: Follow PEP 8 guidelines
- **JavaScript/TypeScript**: Use ESLint and Prettier
- **React**: Follow React best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini API**: For AI-powered content analysis
- **YouTube Transcript API**: For video transcript extraction
- **FastAPI**: For robust API framework
- **React**: For interactive user interface
- **Plasmo**: For browser extension framework

## 📞 Support

If you encounter any issues or have questions:

1. **Check Troubleshooting**: Review the troubleshooting section
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Create Issue**: Submit a new issue with detailed information
4. **Community**: Join our Discord server for community support

---

**Made with ❤️ by the SmartEd Team**

Transform your YouTube learning experience with AI-powered insights!