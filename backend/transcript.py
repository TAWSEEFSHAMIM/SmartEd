from youtube_transcript_api import YouTubeTranscriptApi
import re
from dotenv import load_dotenv
import os
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_video_id(youtube_url):
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:watch\?v=)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            return match.group(1)
    return None

def get_transcript(video_url):
    import time
    import random
    
    video_id = extract_video_id(video_url)
    if not video_id:
        return "Invalid YouTube URL"
    
    # First, try using YouTube Transcript API with multiple strategies
    youtube_api_error = None
    
    # Strategy 1: Try multiple languages
    languages_to_try = [['en'], ['en-US'], ['en-GB'], ['auto'], None]  # None means any available
    
    for languages in languages_to_try:
        try:
            if languages:
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
            else:
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            return " ".join([t["text"] for t in transcript_list])
        except Exception as e:
            youtube_api_error = e
            continue
    
    # Strategy 2: Try to list available transcripts first
    try:
        transcript_list_obj = YouTubeTranscriptApi.list_transcripts(video_id)
        for transcript in transcript_list_obj:
            try:
                transcript_data = transcript.fetch()
                return " ".join([t["text"] for t in transcript_data])
            except:
                continue
    except Exception as e:
        youtube_api_error = e
    
    # Strategy 3: Retry with delay (in case of rate limiting)
    for attempt in range(2):
        try:
            time.sleep(1 + random.random())  # Random delay
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            return " ".join([t["text"] for t in transcript_list])
        except Exception as e:
            youtube_api_error = e
            continue
    
    print(f"YouTube Transcript API failed: {str(youtube_api_error)}")
    print("Falling back to Gemini API...")
    
    # Fallback to Gemini API
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    parts=[
                        types.Part(file_data=types.FileData(file_uri=video_url)),
                        types.Part(text="""Please transcribe the audio of the linked video into a plain-text transcript. 
• Include timestamps at least every 30 seconds or whenever the speaker/topic changes. 
• Label each timestamp in the format "[HH:MM:SS]" at the start of each segment. 
• Do not include any descriptions of visuals, on-screen text, or scene details—only spoken words. 
• Preserve speaker turns if multiple voices are present (e.g. "Speaker 1: …", "Speaker 2: …"). 
• Output the transcript as one continuous document, so I can ingest it easily for summarization, quiz generation, and interactive Q&A.""")
                    ]
                )
            ]
        )
        
        # Extract text from Gemini response
        if response and hasattr(response, 'text') and response.text:
            return response.text
        elif response and hasattr(response, 'candidates') and response.candidates:
            try:
                return response.candidates[0].content.parts[0].text
            except (IndexError, AttributeError):
                # Try alternative access patterns
                try:
                    return str(response.candidates[0])
                except:
                    return str(response)
        else:
            return f"Error: Gemini API returned unexpected response format: {str(response)}"
        
        # Extract text from Gemini response
        if response and response.text:
            return response.text
        else:
            return "Error: Gemini API returned empty response"
            
    except Exception as gemini_error:
        return f"Error: Both YouTube Transcript API and Gemini API failed. YouTube API: {str(youtube_api_error)}, Gemini API: {str(gemini_error)}"

if __name__ == "__main__":
    # Test with a YouTube video known to have captions
    test_input = input("Enter YouTube URL: ")
    transcript = get_transcript(test_input)
    
    print(f"Video ID: {extract_video_id(test_input)}")
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Transcript preview: {transcript[:200]}...")