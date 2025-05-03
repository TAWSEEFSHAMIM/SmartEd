# test_transcript.py
from youtube_transcript_api import YouTubeTranscriptApi
import re

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
    video_id = extract_video_id(video_url)
    if not video_id:
        return "Invalid YouTube URL"
    
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([t["text"] for t in transcript_list])
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Test with a YouTube video known to have captions
    test_input = input("Press Enter to run the test...\n\n")
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Astley video
    transcript = get_transcript(test_input)
    
    print(f"Video ID: {extract_video_id(test_input)}")
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Transcript preview: {transcript[:200]}...")