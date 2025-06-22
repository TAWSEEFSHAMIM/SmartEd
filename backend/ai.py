import os
from openai import OpenAI
from google import genai
from google.genai import types
from dotenv import load_dotenv
from transcript import get_transcript

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

SUMMARY_MODEL = "gemini-2.0-flash"
QUIZ_MODEL = "gemini-2.0-flash"

client = genai.Client(api_key=api_key)

def summarize_transcript(url, max_length=800):
    """
    Summarizes a video transcript using Gemini API.

    Args:
        url (str): The YouTube video URL
        max_length (int): Maximum desired length of the summary

    Returns:
        str: A concise summary of the transcript
    """
    # transcript = get_transcript(url)    
    # if not transcript or len(transcript) < 50:
    #     return "Transcript too short or empty to summarize."

    system_instructions = f"""You are a specialized AI text summarization assistant embedded in a YouTube Video Assistant browser extension. Your sole purpose is to create concise, informative summaries of youtube videos that capture the key points while maintaining context and readability.

    Guidelines:
    1. Create summaries that are approximately 30% of the original video length, but make sure the summary is complete
    2. Focus on extracting the most important concepts, facts, and conclusions
    3. Preserve the original sequence of ideas when possible
    4. Use clear, direct language suitable for educational contexts
    5. Maintain a neutral tone that reflects the original content
    6. Include important numerical data, names, and technical terms when relevant
    7. Avoid introducing opinions or interpretations not present in the original content
    8. Structure the summary with paragraphs for readability when appropriate
    9. Format technical content, steps, or lists in a structured way
    10. Exclude filler content, repetitions, or tangential information

    Focus on the information provided in the video without making assumptions about missing content."""

    prompt = f"""
    Please summarize the following YouTube video:

    VIDEO URL:
    {url}

    Format your summary to include:
    1. A one-sentence overview of the video's main topic
    2. Core concepts and key points presented in the video
    3. Any important conclusions or takeaways

    The summary should be concise while capturing the essential information a student would need to understand the video's content. Format the summary as markdown text with clear headings and bullet points where appropriate.
    Keep the summary under {max_length} words.
    """

    try:
        response = client.models.generate_content(
            model=SUMMARY_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instructions),
            contents=types.Content(
                parts=[
                    types.Part(
                        file_data=types.FileData(file_uri=url)
                    ),
                    types.Part(text=prompt)
                ],
            )
        )
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"


def generate_quiz(url, num_questions=5):
    """
    Generates a quiz based on a video url using Gemini API.
    
    Args:
        url (str): The YouTube video URL
        num_questions (int): Number of questions to generate
        
    Returns:
        dict: A JSON-formatted quiz with questions, options, and answers
    """
    system_instructions = f"""
    You are a specialized AI quiz generator embedded in a YouTube Video Assistant browser extension. Your purpose is to create educational assessment questions based on video content that test understanding and retention of key concepts.
    Guidelines:
    1. Generate multiple-choice questions that assess comprehension of main concepts
    2. Create questions of varying difficulty levels (recall, application, analysis)
    3. Ensure all questions are directly answerable from the video content
    4. Write clear, unambiguous questions with precise wording
    5. Provide exactly one correct answer option and three plausible distractors
    6. Avoid extremely obvious incorrect options that don't challenge understanding
    7. Use consistent formatting and structure for all questions
    8. Focus on substantive content rather than trivial details
    9. Include questions that test conceptual understanding, not just memorization
    10. Ensure questions and answer options are grammatically consistent
    video transcript.
    11. Generate {num_questions} questions that test understanding of the key concepts. 
    
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
    """
    prompt = f"""
    Based on the following YouTube video transcript, generate a quiz multiple-choice questions:
      
    VIDEO URL:
    {url}

    For each question:
    1. Write a clear question that tests understanding of key concepts from the video
    2. Provide 4 options labeled A, B, C, and D
    3. Indicate the correct answer after each question
    4. Ensure questions cover different parts or concepts from the video
    5. Include at least one higher-level thinking question that requires analysis or application
    """
    
    try:
        response = client.models.generate_content(
            model=SUMMARY_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instructions),
            contents=types.Content(
                parts=[
                    types.Part(
                        file_data=types.FileData(file_uri=url)
                    ),
                    types.Part(text=prompt)
                ],
            )
        )
        return response.text
    except Exception as e:
        return f"Error generating quiz: {str(e)}"


        
if __name__ == "__main__":
    url ="https://www.youtube.com/watch?v=wjZofJX0v4M"
    
    # transcript = get_transcript(url)
    # print(f"{transcript[:300]}\n\n")
    
    summary = summarize_transcript(url)
    print(f"{summary}\n\n")
    
    quiz = generate_quiz(url)
    print(f"{quiz}\n\n")
    
