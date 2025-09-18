# Updated Fast API Main with Merged Video Assistant
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# from transcript import get_transcript
from model import summarize_transcript, generate_quiz, ask_question_about_video, preload_video_content, _extract_video_content
from pydantic import BaseModel
import json
from fastapi import Request
from model import current_api_key  # ContextVar defined in model.py


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

class ChatRequest(BaseModel):
    url: str
    question: str

class Request(BaseModel):
    url: str

@app.middleware("http")
async def attach_api_key(request: Request, call_next):
    """
    Pull 'X-API-Key' from the request headers and set it in the request-scoped ContextVar.
    Ensures all model.py functions in this request see the right key via get_client().
    """
    token = None
    try:
        api_key = request.headers.get("X-API-Key")
        if api_key:
            token = current_api_key.set(api_key)
        response = await call_next(request)
        return response
    finally:
        # Clean up the ContextVar so it doesn't leak across requests
        if token is not None:
            current_api_key.reset(token)



@app.get("/")
def read_root():
    return {"status": "online", "service": "SmartEd API"}

@app.post("/transcript")
def get_transcript_endpoint(video: VideoURL):
    try:
        transcript = _extract_video_content(video.url)
        if not transcript or transcript.startswith("Error") or transcript == "Invalid YouTube URL":
            raise HTTPException(status_code=400, detail=transcript or "Failed to get transcript")
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
def summarize_endpoint(request: SummarizeRequest):
    try:
        summary = summarize_transcript(request.url, max_length=request.max_length)
        
        if summary.startswith("Error"):
            raise HTTPException(status_code=400, detail=summary)
            
        return {"summary": summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz")
def quiz_endpoint(request: QuizRequest):
    try:
        quiz_result = generate_quiz(request.url, num_questions=request.num_questions)
        
        if isinstance(quiz_result, str) and quiz_result.startswith("Error"):
            raise HTTPException(status_code=400, detail=quiz_result)
        
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

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """Ask a question about a specific video"""
    try:
        answer = ask_question_about_video(request.url, request.question)
        
        if answer.startswith("Error"):
            raise HTTPException(status_code=400, detail=answer)
            
        return {
            "question": request.question,
            "answer": answer
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-analysis")
def complete_analysis_endpoint(request: Request):
    """Pre-loads video content and gets summary and quiz in one request"""
    try:
        # Pre-extract video content to cache it for faster subsequent calls
        video_content = _extract_video_content(request.url)
        
        if video_content.startswith("Error"):
            raise HTTPException(status_code=400, detail=video_content)
       
        # Now get summary and quiz (these will use cached content)
        summary = summarize_transcript(request.url)
        
        if summary.startswith("Error"):
            raise HTTPException(status_code=400, detail=summary)
       
        quiz_result = generate_quiz(request.url)
        
        if isinstance(quiz_result, str) and quiz_result.startswith("Error"):
            raise HTTPException(status_code=400, detail=quiz_result)
        
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
            "quiz": quiz_result,
            "cached": True  # Indicates content is now cached for fast subsequent calls
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/preload")
def preload_endpoint(video: VideoURL):
    """Preload video content for faster subsequent operations"""
    try:
        success = preload_video_content(video.url)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to preload video content")
            
        return {
            "message": "Video content preloaded successfully",
            "url": video.url,
            "cached": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":      
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)