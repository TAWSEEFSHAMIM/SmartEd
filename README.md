# 📘 SmartEd — AI-Powered Learning Assistant for YouTube

**SmartEd** is a free, open-source Chrome extension that transforms YouTube into a smart, interactive study platform.  
Built for students, educators, and lifelong learners, SmartEd helps you summarize videos, generate quizzes, and identify the best videos for your study goals — right within the YouTube interface.

> 🚀 This extension uses **Google Gemini Pro API** (via the user's own key) to stay entirely free and scalable for everyone.

---

## 🔍 Core Features

### 1. 📝 YouTube Video Summarization
- Extracts and condenses YouTube transcripts
- Customizable summary length and focus areas
- Works across educational domains and languages

### 2. ❓ Interactive Quiz Generation
- Creates MCQs, fill-in-the-blanks, and True/False questions
- Contextual explanations provided for incorrect answers
- Auto-adjusts difficulty and learning scope

### 3. 🎯 Topic-Based Video Recommendation
- Users create a "study instance" by listing topics
- Manually add promising YouTube videos
- Gemini-powered NLP compares transcript content with listed topics and ranks relevance

---

## 💡 Tech Stack

| Layer         | Technology                     |
|---------------|--------------------------------|
| **Frontend**  | HTML, CSS, JavaScript, Chrome Extensions API |
|               | Dynamic DOM injection via `content.js` |
| **Backend**   | Python, FastAPI                |
|               | NLP: `youtube-transcript-api`, `sentence-transformers`, Gemini |
|               | Optional: `transformers`, `scikit-learn`, `langchain` |

---



## 🔐 Gemini API Setup (Free User Key)

This project uses **Google Gemini Pro** for all AI tasks. To ensure it's free for users:

1. Create your own Gemini API key:
   - Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Copy your key (starts with `AIz...`)

2. Add it to your environment as:
   ```bash
   export GEMINI_API_KEY=your_key_here
     Or save it in a .env file:
   GEMINI_API_KEY=your_key_here



