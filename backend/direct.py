from dotenv import load_dotenv
import os
from google import genai
from google.genai import types

load_dotenv()

# api_key = os.getenv('GEMINI_API_KEY')
# Configure the API key (you'll need to set this)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# Create the client
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=
        types.Content(
            parts=[
              types.Part(file_data=types.FileData(file_uri='https://youtu.be/wjZofJX0v4M?si=3kc-zOOe-MElzuwh')),
        
        types.Part(text='Transcribe the audio from this video, giving timestamps for salient events in the video. Also provide visual descriptions.')
    ])
)
print(response.text)