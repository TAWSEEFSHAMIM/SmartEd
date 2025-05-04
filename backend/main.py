from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transcript import get_transcript
from ai import summarize_transcript, generate_quiz
from pydantic import BaseModel

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoURL(BaseModel):
    url: str
    
class SummarizeRequest(BaseModel):
    url: str
    max_length: int = 800

class QuizRequest(BaseModel):
    url: str
    num_questions: int = 5

@app.get("/")
def read_root():
    return {"status": "online", "service": "SmartEd API"}

@app.post("/transcript")
def get_transcript_endpoint(video: VideoURL):
    transcript = get_transcript(video.url)
    if transcript.startswith("Error"):
        raise HTTPException(status_code=400, detail=transcript)
    return {"transcript": transcript}

@app.post("/summarize")
def summarize_endpoint(request: SummarizeRequest):
    transcript = get_transcript(request.url)
    if transcript.startswith("Error") or transcript == "Invalid YouTube URL":
        raise HTTPException(status_code=400, detail=transcript)
    
    summary = summarize_transcript(transcript, request.max_length)
    return {
        "transcript": transcript,
        "summary": summary
    }

@app.post("/quiz")
def quiz_endpoint(request: QuizRequest):
    transcript = get_transcript(request.url)
    if transcript.startswith("Error") or transcript == "Invalid YouTube URL":
        raise HTTPException(status_code=400, detail=transcript)
    
    quiz = generate_quiz(transcript, request.num_questions)
    return {
        "quiz": quiz
    }

@app.post("/complete-analysis")
def complete_analysis_endpoint(request: QuizRequest):
    """Gets transcript, summary, and quiz in one request"""
    transcript = get_transcript(request.url)
    if transcript.startswith("Error") or transcript == "Invalid YouTube URL":
        raise HTTPException(status_code=400, detail=transcript)
    
    summary = summarize_transcript(transcript)
    quiz = generate_quiz(transcript, request.num_questions)
    
    return {
        "transcript": transcript,
        "summary": summary,
        "quiz": quiz
    }

# Run with: uvicorn main:app --reload