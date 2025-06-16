from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transcript import get_transcript
from ai import summarize_transcript, generate_quiz
from pydantic import BaseModel
import json

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

class Request(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"status": "online", "service": "SmartEd API"}

@app.post("/transcript")
def get_transcript_endpoint(video: VideoURL):
    try:
        transcript = get_transcript(video.url)
        if not transcript or transcript.startswith("Error") or transcript == "Invalid YouTube URL":
            raise HTTPException(status_code=400, detail=transcript or "Failed to get transcript")
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
def summarize_endpoint(request: SummarizeRequest):
    try:
        transcript = get_transcript(request.url)
        if not transcript or transcript.startswith("Error") or transcript == "Invalid YouTube URL":
            raise HTTPException(status_code=400, detail=transcript or "Failed to get transcript")
       
        summary = summarize_transcript(transcript, max_length=request.max_length)
        return {
            "transcript": transcript,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz")
def quiz_endpoint(request: QuizRequest):
    try:
        transcript = get_transcript(request.url)
        if not transcript or transcript.startswith("Error") or transcript == "Invalid YouTube URL":
            raise HTTPException(status_code=400, detail=transcript or "Failed to get transcript")
       
        quiz_result = generate_quiz(transcript, num_questions=request.num_questions)
        
        # Handle different response formats - could be JSON string or dict with error
        if isinstance(quiz_result, dict) and "error" in quiz_result:
            raise HTTPException(status_code=400, detail=quiz_result["error"])
        
        # If quiz_result is a string (JSON), parse it
        if isinstance(quiz_result, str):
            try:
                quiz_result = json.loads(quiz_result)
            except json.JSONDecodeError:
                # If not valid JSON, return as is
                pass
                
        return {"quiz": quiz_result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-analysis")
def complete_analysis_endpoint(request: Request):
    """Gets transcript, summary, and quiz in one request"""
    try:
        # transcript = get_transcript(request.url)
        # if not transcript or transcript.startswith("Error") or transcript == "Invalid YouTube URL":
        #     raise HTTPException(status_code=400, detail=transcript or "Failed to get transcript")
       
        summary = summarize_transcript(request.url)
       
        quiz_result = generate_quiz(request.url)
        
        # Handle different response formats - could be JSON string or dict with error
        if isinstance(quiz_result, dict) and "error" in quiz_result:
            raise HTTPException(status_code=400, detail=quiz_result["error"])
        
        # If quiz_result is a string (JSON), parse it
        if isinstance(quiz_result, str):
            try:
                quiz_result = json.loads(quiz_result)
            except json.JSONDecodeError:
                # If not valid JSON, return as is
                pass
                
        return {
            "summary": summary,
            "quiz": quiz_result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# if __name__ == "__main__":      
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)