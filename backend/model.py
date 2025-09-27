import os
from openai import OpenAI
from google import genai
from google.genai import types

from contextvars import ContextVar
from typing import Optional



# Use GOOGLE_API_KEY since that's what the library prefers
# DEFAULT_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

# Request-scoped API key (set by middleware in main.py)
current_api_key: ContextVar[Optional[str]] = ContextVar("current_api_key", default=None)


SUMMARY_MODEL = "gemini-2.0-flash"
QUIZ_MODEL = "gemini-2.0-flash"
CHAT_MODEL = "gemini-2.0-flash"




def _active_api_key() -> Optional[str]:
  """Return the API key for the current request (user key first, else default)."""
  return current_api_key.get()

def get_client():
  """Return a Gemini client bound to the active (request-scoped) API key."""
  key = _active_api_key()
  if not key:
    raise RuntimeError(
      "No Gemini API key provided. Pass X-API-Key from the extension or set GOOGLE_API_KEY in .env."
    )
  return genai.Client(api_key=key)

# Global variables to store video data
_video_cache = {}

def _extract_video_content(url):
    
    """
    Private function to extract comprehensive video content using Gemini API.
    This content will be used for summary, quiz, and chat features.
    """
    client = get_client()

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
    client = get_client()

    # Get comprehensive video content (cached if already extracted)
    video_content = _extract_video_content(url)
    
    

    system_instructions = """
You are a specialized AI text summarization assistant that produces well-structured, markdown-formatted summaries. 
Your output should be concise (≈30% of original length), visually organized, and easy to scan.

Content Guidelines
- Summaries should capture the most important concepts, facts, and conclusions.
- Preserve the original sequence of ideas when possible.
- Use clear, direct language appropriate for educational and professional contexts.
- Retain names, numbers, dates, and technical terms when relevant.
- Avoid redundancy; focus on clarity and relevance.

Markdown Formatting Rules
- Use # for main title (keep it short and directly relevant to the video).
- Use ## for major sections.
- Use ### for subsections.
- Use **bold** for key terms and important concepts (especially in the brief Introduction).
- Use *italic* for emphasis and secondary points and don't use bullets for these.
- Use a variety of bullet styles:
  - Solid bullets `-` for **main points that are not part of a sub-heading**
    - Indented solid bullets `-` for **examples, clarifications, or explanations under a main point**
- Always use bullet formatting for lists and details.
- Use 1. for steps or prioritized sequences.
- Use > for important quotes or insights.
- Use `code` for technical terms, variables, or commands.
- Do NOT insert horizontal lines (`---`) at the end of each section.
- Use "Highlights" sections with `- **Attribute**: value` format for clarity.

Required Output Structure
- Main Title (H1, bold, centered if possible, and concise)
- Brief Introduction (2–3 sentences setting context)
- Highlights Section for key attributes (location, size, features, etc.)
- Organized Sections with proper headings (##, ###)
- Bullet points for lists and details (with nested indentation for hierarchy)
- Key Takeaways section at the end, summarizing the essence in 3–5 bullets
"""


    prompt = f"""
    Based on the following comprehensive video content analysis, create a well-structured markdown summary:

    VIDEO CONTENT:
    {video_content}

    Create a summary that follows this exact structure:

    1. Start with # (Main part of video tittle) as the main title

    2. Begin with a brief introduction paragraph that uses **bold** for key terms

    3. Include these main sections using ## headings:
       - ## Overview
       - ## Key Points
       - ## Important Details
       - ## Key Takeaways

    4. Under each section:
       - Always use bullet points (- ) for listing related items
       - Use *italic* for emphasis and explanations
       - Use > for highlighting crucial information
       - Break complex ideas into sub-bullets

    5. End with a "## Key Takeaways" section that summarizes the most important points using bullet points

    Make the summary comprehensive yet concise, keeping it under and close to {max_length} words while ensuring proper markdown formatting for optimal readability.

    Remember to:
    - Use proper markdown syntax for all formatting
    - Maintain clear hierarchy in headings
    - Use bullet points for better organization
    - Bold key terms and concepts
    - Include relevant numerical data and specifics
    - End with actionable takeaways

    Format your response entirely in markdown, ensuring each section is properly formatted and visually organized.
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


def generate_quiz(url, num_questions=6):
    """
    Generates a quiz based on pre-extracted video content using Gemini API.
    
    Args:
        url (str): The YouTube video URL
        num_questions (int): Number of questions to generate
        
    Returns:
        dict: A JSON-formatted quiz with questions, options, and answers
    """
    client = get_client()

    # Get comprehensive video content (cached if already extracted)
    video_content = _extract_video_content(url)
    
    

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


def ask_question_about_video(url, question, history=None):
    """
    Ask a specific question about a video using pre-extracted content and chat history.

    Args:
        url (str): The YouTube video URL
        question (str): The question to ask about the video
        history (list): List of previous Q&A dicts: [{ "question": ..., "answer": ... }, ...]

    Returns:
        str: Answer to the question based on video content and chat history
    """
    client = get_client()

    # Get comprehensive video content (cached if already extracted)
    video_content = _extract_video_content(url)

    system_instructions = """
Your name is SmartEd AI, a versatile educational assistant.
You must answer every question the user asks.

- If the question is related to the provided video content, always base your answer strictly on the video content analysis given.
- If the question is not related to the video, answer using your general knowledge and reasoning.
- If uncertain whether the question is related to the video, clarify with the user before answering.
- Use the previous chat history to maintain context and continuity in your answers.
"""

    # Format chat history for the prompt
    history_text = ""
    if history:
        history_text = "\n".join(
            [f"Q{idx+1}: {h['question']}\nA{idx+1}: {h['answer']}" for idx, h in enumerate(history)]
        )

    prompt = f"""
You are answering as SmartEd AI.

VIDEO CONTENT ANALYSIS (Transcript Extracted):
{video_content}

CHAT HISTORY:
{history_text}

USER QUESTION:
{question}

INSTRUCTION:
- If the user’s question is about the video, answer using only the VIDEO CONTENT ANALYSIS and the chat history above.
- If it is not related to the video, answer with your general knowledge.
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
        return not content
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