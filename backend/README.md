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
   ```
   Or save it in a .env file:
   ```
   GEMINI_API_KEY=your_key_here
   ```

---

# SmartEd Backend

AI-powered backend for YouTube lecture video summarization and quiz generation using Google's Gemini API.

## Features

- Extract transcripts from YouTube educational videos
- Generate concise summaries of video content
- Create multiple-choice quizzes based on video content
- RESTful API endpoints for frontend integration

## Setup

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd SmartEd/backend
   ```

2. **Set up a virtual environment (optional but recommended)**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
   - Add your API key to the `.env` file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

5. **Run the server**
   ```
   uvicorn main:app --reload
   ```

## API Endpoints

### `GET /`
- Health check endpoint
- Returns: `{"status": "online", "service": "SmartEd API"}`

### `POST /transcript`
- Get the transcript of a YouTube video
- Body:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=video_id"
  }
  ```
- Returns: `{"transcript": "video transcript text..."}`

### `POST /summarize`
- Summarize a YouTube video
- Body:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=video_id",
    "max_length": 800  // Optional, default is 800 words
  }
  ```
- Returns:
  ```json
  {
    "transcript": "full transcript...",
    "summary": "summarized content..."
  }
  ```

### `POST /quiz`
- Generate a quiz based on a YouTube video
- Body:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=video_id",
    "num_questions": 5  // Optional, default is 5
  }
  ```
- Returns:
  ```json
  {
    "quiz": {
      "questions": [
        {
          "question": "Question text?",
          "options": {
            "A": "Option A",
            "B": "Option B",
            "C": "Option C",
            "D": "Option D"
          },
          "correct_answer": "A",
          "explanation": "Explanation for the answer"
        },
        // more questions...
      ]
    }
  }
  ```

### `POST /complete-analysis`
- Get transcript, summary, and quiz in one request
- Body:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=video_id",
    "num_questions": 5  // Optional, default is 5
  }
  ```
- Returns:
  ```json
  {
    "transcript": "full transcript...",
    "summary": "summarized content...",
    "quiz": {
      // quiz content as above
    }
  }
  ```

## Technologies Used

- FastAPI
- Google Gemini API
- YouTube Transcript API
- Python 3.7+

## License

[Include your license information here]



