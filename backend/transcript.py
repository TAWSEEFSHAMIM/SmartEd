
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig
from youtube_transcript_api.formatters import TextFormatter
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


ytt_api = YouTubeTranscriptApi(
    proxy_config=GenericProxyConfig(
        http_url="http://hynwgqgq:y4e16wyl9gwm@154.36.110.199:6853",
        # https_url="https://hynwgqgq:y4e16wyl9gwm@154.36.110.199:6853",
    )
)

formatter = TextFormatter()

def get_transcript(video_url):  
    video_id = extract_video_id(video_url)
    print(f"Extracted video ID: {video_id}")    
    if not video_id:
        return "Invalid YouTube URL"
    
    try:
        transcript_list = ytt_api.fetch(video_id)
        transcript = formatter.format_transcript(transcript_list)

        return transcript
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    test_input = input("Enter YouTube video URL: ")
    # Define your proxy settings here
    proxy = {
        "http": "http://username:password@proxy.example.com:port",
        "https": "https://username:password@proxy.example.com:port"
    }
    transcript = get_transcript(test_input, proxies=proxy)
    
    print(f"Video ID: {extract_video_id(test_input)}")
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Transcript preview: {transcript[:200]}...")
