from dotenv import load_dotenv
import os
load_dotenv()
from google import genai
from google.genai import types

gemini_api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=gemini_api_key)

def summarize_transcript(transcript, max_length=800):
    """
    Summarizes a video transcript using Gemini API.
    
    Args:
        transcript (str): The transcript text to summarize
        max_length (int): Maximum desired length of the summary
        
    Returns:
        str: A concise summary of the transcript
    """
    if not transcript or len(transcript) < 50:
        return "Transcript too short or empty to summarize."
    
    prompt = f"""
    You are an educational content summarizer. Summarize the following video transcript 
    in a concise but informative way. Identify key concepts, main points, and important takeaways.
    Format the summary with clear headings and bullet points where appropriate.
    Keep the summary under {max_length} words.
    
    TRANSCRIPT:
    {transcript}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro-exp-03-25",
            config=types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40,
                response_mime_type="text/plain",
                max_output_tokens=1024,
            ),
            contents=prompt
        )
        
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def generate_quiz(transcript, num_questions=5):
    """
    Generates a quiz based on a video transcript using Gemini API.
    
    Args:
        transcript (str): The transcript text to generate a quiz from
        num_questions (int): Number of questions to generate
        
    Returns:
        dict: A JSON-formatted quiz with questions, options, and answers
    """
    if not transcript or len(transcript) < 100:
        return {"error": "Transcript too short or empty to generate quiz."}
    
    prompt = f"""
    You are an educational quiz creator. Create a multiple-choice quiz based on the following 
    video transcript. Generate {num_questions} questions that test understanding of the key concepts.
    
    For each question:
    - Provide a clear question
    - Include 4 possible answers (A, B, C, D)
    - Mark the correct answer
    - Include a brief explanation of why the answer is correct
    
    Format your response as JSON with the following structure:
    {{
      "questions": [
        {{
          "question": "Question text here",
          "options": {{
            "A": "First option",
            "B": "Second option",
            "C": "Third option",
            "D": "Fourth option"
          }},
          "correct_answer": "A",
          "explanation": "Explanation here"
        }}
      ]
    }}
    
    TRANSCRIPT:
    {transcript}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro-exp-03-25",
            config=types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40,
                response_mime_type="application/json",
                max_output_tokens=2048,
            ),
            contents=prompt
        )
        
        return response.text
    except Exception as e:
        return {"error": f"Error generating quiz: {str(e)}"}

# Example usage (for testing)
if __name__ == "__main__":
    test_transcript = "This is a test transcript. It would normally contain the full content of a video lecture."
    print(summarize_transcript(test_transcript))
    print(generate_quiz(test_transcript))
