import os
from openai import OpenAI
from google import genai
from google.genai import types
from dotenv import load_dotenv
from transcript import get_transcript

load_dotenv()
# Use GOOGLE_API_KEY since that's what the library prefers
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

SUMMARY_MODEL = "gemini-2.0-flash"
QUIZ_MODEL = "gemini-2.0-flash"
CHAT_MODEL = "gemini-2.0-flash"

client = genai.Client(api_key=api_key)

# Global variables to store video data
_video_cache = {}

def _extract_video_content(url):
    """
    Private function to extract comprehensive video content using Gemini API.
    This content will be used for summary, quiz, and chat features.
    """
    if url in _video_cache:
        return _video_cache[url]
    
    system_instructions = """You are a comprehensive AI video content analyzer. Your purpose is to extract detailed information from YouTube videos that will be used for multiple purposes: summarization, quiz generation, and interactive Q&A.

    Guidelines:
    1. Extract ALL important information, concepts, facts, and details from the video
    2. Maintain the original sequence and structure of ideas
    3. Include specific examples, case studies, and numerical data mentioned
    4. Capture technical terms, names, dates, and important references
    5. Note any step-by-step processes or methodologies explained
    6. Include conclusions, recommendations, and key takeaways
    7. Preserve context and relationships between different concepts
    8. Format the content in a structured, comprehensive manner
    9. Avoid summarizing at this stage - capture everything important
    10. This content will be used to generate summaries, quizzes, and answer questions

    Provide a comprehensive analysis that captures the full educational value of the video."""

    prompt = f"""
    Please provide a comprehensive content analysis of the following YouTube video:

    VIDEO URL: {url}

    Extract all important information including:
    1. Main topics and subtopics covered
    2. Key concepts, facts, and details
    3. Examples, case studies, and specific instances mentioned
    4. Technical information, processes, and methodologies
    5. Important names, dates, numbers, and references
    6. Conclusions, recommendations, and takeaways
    7. Any supporting evidence or reasoning provided

    This analysis will be used to generate summaries, create quizzes, and answer specific questions about the video content.
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
        
        # Cache the result
        _video_cache[url] = response.text
        return response.text
        
    except Exception as e:
        error_msg = f"Error extracting video content: {str(e)}"
        _video_cache[url] = error_msg
        return error_msg


def summarize_transcript(url, max_length=800):
    """
    Summarizes a video transcript using pre-extracted video content.

    Args:
        url (str): The YouTube video URL
        max_length (int): Maximum desired length of the summary

    Returns:
        str: A concise summary of the transcript
    """
    # Get comprehensive video content (cached if already extracted)
    video_content = _extract_video_content(url)
    
    if video_content.startswith("Error"):
        return video_content

    system_instructions = """You are a specialized AI text summarization assistant. Create concise, informative summaries that capture key points while maintaining context and readability.

    Guidelines:
    1. Create summaries that are approximately 30% of the original content length
    2. Focus on the most important concepts, facts, and conclusions
    3. Preserve the original sequence of ideas when possible
    4. Use clear, direct language suitable for educational contexts
    5. Maintain a neutral tone that reflects the original content
    6. Include important numerical data, names, and technical terms when relevant
    7. Structure the summary with paragraphs for readability when appropriate
    8. Format technical content, steps, or lists in a structured way
    9. Exclude filler content, repetitions, or tangential information"""

    prompt = f"""
    Based on the following comprehensive video content analysis, create a concise summary:

    VIDEO CONTENT:
    {video_content}

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
                parts=[types.Part(text=prompt)]
            )
        )
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"


def generate_quiz(url, num_questions=5):
    """
    Generates a quiz based on pre-extracted video content using Gemini API.
    
    Args:
        url (str): The YouTube video URL
        num_questions (int): Number of questions to generate
        
    Returns:
        dict: A JSON-formatted quiz with questions, options, and answers
    """
    # Get comprehensive video content (cached if already extracted)
    video_content = _extract_video_content(url)
    
    if video_content.startswith("Error"):
        return video_content

    system_instructions = f"""
    You are a specialized AI quiz generator. Create educational assessment questions based on video content that test understanding and retention of key concepts.
    
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
    11. Generate {num_questions} questions that test understanding of the key concepts
    
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
    Based on the following video content analysis, generate {num_questions} multiple-choice questions:
      
    VIDEO CONTENT:
    {video_content}

    For each question:
    1. Write a clear question that tests understanding of key concepts from the video
    2. Provide 4 options labeled A, B, C, and D
    3. Indicate the correct answer after each question
    4. Ensure questions cover different parts or concepts from the video
    5. Include at least one higher-level thinking question that requires analysis or application
    """
    
    try:
        response = client.models.generate_content(
            model=QUIZ_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instructions),
            contents=types.Content(
                parts=[types.Part(text=prompt)]
            )
        )
        return response.text
    except Exception as e:
        return f"Error generating quiz: {str(e)}"


def ask_question_about_video(url, question):
    """
    Ask a specific question about a video using pre-extracted content.
    
    Args:
        url (str): The YouTube video URL
        question (str): The question to ask about the video
        
    Returns:
        str: Answer to the question based on video content
    """
    # Get comprehensive video content (cached if already extracted)
    video_content = _extract_video_content(url)
    
    if video_content.startswith("Error"):
        return video_content

    system_instructions = """You are a versatile AI assistant that answers questions about YouTube video content and general knowledge.

RESPONSE RULES:
1. For questions about the video content: Provide comprehensive, detailed answers using the video analysis
2. For general questions: Keep answers brief (15-30 words) but ensure complete, meaningful sentences
3. Always identify if a question relates to the video content or is general knowledge
4. Use "Based on video:" prefix for video-content answers
5. Use "General answer:" prefix for non-video questions
6. Keep video-content answers comprehensive but focused on the specific question asked
7. Use ONLY information from the provided video content analysis for video-related questions
8. For video questions with insufficient detail, state: "Not enough detail in video content."
9. For general questions, use your knowledge but keep responses extremely concise
10. Focus on factual content extraction for video questions, interpretation allowed for general questions

Your purpose: Extract specific information from video content efficiently while also providing brief general knowledge assistance."""
    
    prompt = f"""Based on the following video content analysis, please answer the user's question:

VIDEO CONTENT ANALYSIS:
{video_content}

USER QUESTION: {question}

"""

    try:
        response = client.models.generate_content(
            model=CHAT_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instructions
            ),
            contents=types.Content(
                parts=[types.Part(text=prompt)]
            )
        )
        
        return response.text
        
    except Exception as e:
        return f"Error generating answer: {str(e)}"


def preload_video_content(url):
    """
    Preload video content for faster subsequent operations.
    Useful when you know you'll be using multiple features on the same video.
    
    Args:
        url (str): The YouTube video URL
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        content = _extract_video_content(url)
        return not content.startswith("Error")
    except Exception:
        return False


def clear_video_cache():
    """Clear the video content cache to free memory."""
    global _video_cache
    _video_cache.clear()


def get_cached_videos():
    """Get list of URLs that have cached content."""
    return list(_video_cache.keys())


if __name__ == "__main__":
    url = "https://www.youtube.com/watch?v=wjZofJX0v4M"
    
    print("Testing all features with the same video content extraction...")
    print("=" * 60)
    
    # Test summary
    print("📝 SUMMARY:")
    print("-" * 30)
    summary = summarize_transcript(url)
    print(f"{summary}\n")
    
    # Test quiz (uses cached content)
    print("📋 QUIZ:")
    print("-" * 30)
    quiz = generate_quiz(url, 3)
    print(f"{quiz}\n")
    
    # Test Q&A (uses cached content)
    print("💬 Q&A:")
    print("-" * 30)
    answer = ask_question_about_video(url, "What are the main points covered in this video?")
    print(f"Q: What are the main points covered in this video?")
    print(f"A: {answer}\n")
    
    # Show cache status
    print("🗂️ CACHE STATUS:")
    print("-" * 30)
    print(f"Cached videos: {len(get_cached_videos())}")
    print(f"URLs: {get_cached_videos()}")