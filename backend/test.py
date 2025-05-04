"""
Test script for verifying SmartEd API functionality.
Run this script to test the API endpoints without a frontend.
"""

import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables

# API URL - Change this if your FastAPI server is running on a different port
API_URL = "http://localhost:8000"

# A sample educational YouTube video URL
SAMPLE_VIDEO_URL = "https://www.youtube.com/watch?v=kVeOpcw4GWY&list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d&index=2"  # 3Blue1Brown Linear Algebra video


def test_endpoints():
    """Test all API endpoints with a sample video URL"""
    print("======== SmartEd API Test ========")
    
    # Test root endpoint
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Root endpoint: {response.json()}")
    except Exception as e:
        print(f"Error connecting to the API. Is the server running? Error: {e}")
        return
        
    # Test transcript endpoint
    print("\n--- Testing transcript endpoint ---")
    try:
        response = requests.post(
            f"{API_URL}/transcript", 
            json={"url": SAMPLE_VIDEO_URL}
        )
        
        if response.status_code == 200:
            transcript = response.json().get("transcript", "")
            print(f"Transcript length: {len(transcript)} characters")
            print(f"Transcript preview: {transcript[:200]}...")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

    # Test summary endpoint
    print("\n--- Testing summarization endpoint ---")
    try:
        response = requests.post(
            f"{API_URL}/summarize", 
            json={"url": SAMPLE_VIDEO_URL, "max_length": 400}
        )
        
        if response.status_code == 200:
            summary = response.json().get("summary", "")
            print(f"Summary length: {len(summary)} characters")
            print(f"Summary preview: {summary[:200]}...")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")
        
    # Test quiz endpoint
    print("\n--- Testing quiz endpoint ---")
    try:
        response = requests.post(
            f"{API_URL}/quiz", 
            json={"url": SAMPLE_VIDEO_URL, "num_questions": 3}
        )
        
        if response.status_code == 200:
            quiz = response.json().get("quiz", {})
            print("Quiz generated:")
            print(json.dumps(quiz, indent=2)[:500] + "...")  # Print first 500 chars
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

    print("\n======== Test Complete ========")


if __name__ == "__main__":
    test_endpoints()