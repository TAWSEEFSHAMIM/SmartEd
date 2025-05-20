import json
import http.client
import urllib.parse
import time

# Configuration
HOST = "localhost"
PORT = 8000  # Default FastAPI port
TEST_VIDEO_URL = "https://www.youtube.com/watch?v=wjZofJX0v4M"  # Replace with a valid test video

def make_request(method, endpoint, data=None):
    """Make HTTP request to the API endpoint"""
    conn = http.client.HTTPConnection(HOST, PORT)
    headers = {"Content-Type": "application/json"}
    
    if data:
        body = json.dumps(data)
    else:
        body = None
    
    conn.request(method, endpoint, body=body, headers=headers)
    response = conn.getresponse()
    
    response_data = response.read().decode()
    conn.close()
    
    if response_data:
        try:
            return response.status, json.loads(response_data)
        except json.JSONDecodeError:
            return response.status, response_data
    else:
        return response.status, None

def test_root_endpoint():
    """Test the root endpoint"""
    print("\n===== Testing Root Endpoint =====")
    status, data = make_request("GET", "/")
    
    if status == 200 and data.get("status") == "online":
        print("✅ Root endpoint test passed")
        print(f"Response: {data}")
    else:
        print("❌ Root endpoint test failed")
        print(f"Status: {status}, Response: {data}")

def test_transcript_endpoint():
    """Test the transcript endpoint"""
    print("\n===== Testing Transcript Endpoint =====")
    data = {"url": TEST_VIDEO_URL}
    status, response = make_request("POST", "/transcript", data)
    
    if status == 200 and "transcript" in response:
        print("✅ Transcript endpoint test passed")
        print(f"Transcript length: {len(response['transcript'])} characters")
        print(f"Transcript preview: {response['transcript'][:100]}...")
    else:
        print("❌ Transcript endpoint test failed")
        print(f"Status: {status}, Response: {response}")

def test_summarize_endpoint():
    """Test the summarize endpoint"""
    print("\n===== Testing Summarize Endpoint =====")
    data = {"url": TEST_VIDEO_URL, "max_length": 400}
    status, response = make_request("POST", "/summarize", data)
    
    if status == 200 and "summary" in response:
        print("✅ Summarize endpoint test passed")
        print(f"Summary length: {len(response['summary'])} characters")
        print(f"Summary preview: {response['summary'][:100]}...")
    else:
        print("❌ Summarize endpoint test failed")
        print(f"Status: {status}, Response: {response}")

def test_quiz_endpoint():
    """Test the quiz endpoint"""
    print("\n===== Testing Quiz Endpoint =====")
    data = {"url": TEST_VIDEO_URL, "num_questions": 3}
    status, response = make_request("POST", "/quiz", data)
    
    if status == 200 and "quiz" in response:
        print("✅ Quiz endpoint test passed")
        print(f"Quiz response: {json.dumps(response['quiz'], indent=2)[:200]}...")
    else:
        print("❌ Quiz endpoint test failed")
        print(f"Status: {status}, Response: {response}")

def test_complete_analysis_endpoint():
    """Test the complete analysis endpoint"""
    print("\n===== Testing Complete Analysis Endpoint =====")
    data = {"url": TEST_VIDEO_URL}
    status, response = make_request("POST", "/complete-analysis", data)
    
    success = status == 200 and all(k in response for k in ["transcript", "summary", "quiz"])
    
    if success:
        print("✅ Complete analysis endpoint test passed")
        print(f"Response contains: {', '.join(response.keys())}")
        print(f"Summary preview: {response['summary'][:100]}...")
    else:
        print("❌ Complete analysis endpoint test failed")
        print(f"Status: {status}, Response: {response}")

def run_all_tests():
    """Run all tests"""
    print("Starting API tests...")
    
    # First test if API is running
    try:
        test_root_endpoint()
    except Exception as e:
        print(f"❌ Error connecting to API: {e}")
        print("Make sure your FastAPI server is running on http://localhost:8000")
        return
    
    # Run all other tests
    test_transcript_endpoint()
    time.sleep(1)  # Add small delay between tests to avoid overwhelming the API
    
    test_summarize_endpoint()
    time.sleep(1)
    
    test_quiz_endpoint()
    time.sleep(1)
    
    test_complete_analysis_endpoint()
    
    print("\n===== All Tests Completed =====")

if __name__ == "__main__":
    run_all_tests()