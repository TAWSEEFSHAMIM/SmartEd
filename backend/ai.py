from dotenv import load_dotenv
import os
import json

load_dotenv()
from huggingface_hub import InferenceClient
import requests

from transcript import get_transcript

# Load HuggingFace API Key from environment variables
hf_api_key = os.getenv("HF_API_KEY")
# Using Qwen model from Hugging Face
MODEL_NAME = "Qwen/Qwen3-235B-A22B"  # Consistent model for all features
API_URL = "https://router.huggingface.co/novita/models/Qwen/Qwen3-235B-A22B/v1/chat/completions"
headers = {
    "Authorization": "Bearer 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",
}
# Initialize the client once
client = InferenceClient(
    provider="hf-inference", api_key=hf_api_key
)


def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()


def summarize_transcript(transcript, max_length=800):
    """
    Summarizes a video transcript using Hugging Face Inference API.

    Args:
        transcript (str): The transcript text to summarize
        max_length (int): Maximum desired length of the summary

    Returns:
        str: A concise summary of the transcript
    """
    if not transcript or len(transcript) < 50:
        return "Transcript too short or empty to summarize."

    system_instructions = """You are a specialized AI text summarization assistant embedded in a YouTube Video Assistant browser extension. Your sole purpose is to create concise, informative summaries of video transcripts that capture the key points while maintaining context and readability.

    Guidelines:
    1. Create summaries that are approximately 10-15% of the original transcript length
    2. Focus on extracting the most important concepts, facts, and conclusions
    3. Preserve the original sequence of ideas when possible
    4. Use clear, direct language suitable for educational contexts
    5. Maintain a neutral tone that reflects the original content
    6. Include important numerical data, names, and technical terms when relevant
    7. Avoid introducing opinions or interpretations not present in the original content
    8. Structure the summary with paragraphs for readability when appropriate
    9. Format technical content, steps, or lists in a structured way
    10. Exclude filler content, repetitions, or tangential information

    Input may be partial transcripts from longer videos, so focus on the information provided without making assumptions about missing content."""

    prompt = f"""
    Please summarize the following YouTube video transcript:
      
    TRANSCRIPT:
    {transcript}

    Format your summary to include:
    1. A one-sentence overview of the video's main topic
    2. Core concepts and key points presented in the video
    3. Any important conclusions or takeaways

    The summary should be concise while capturing the essential information a student would need to understand the video's content.
    Keep the summary under {max_length} words.
    """

    try:
        response = query(
            {
                "messages": [
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": prompt},
                ],
                "model": MODEL_NAME,
            }
        )
        # Using chat completions API
        # completion = client.chat.completions.create(
        #     model="microsoft/Phi-3.5-mini-instruct",
        # messages=[
        #     {
        #         "role": "system",
        #         "content": system_instructions
        #     },
        #     {
        #         "role": "user",
        #         "content": prompt
        #     }
        # ],
        #     max_tokens=1024,  # Increased for better summaries
        #     temperature=0.3,  # Lower temperature for more focused summaries
        # )

        # Extract the content from the response
        summary = response

        return summary
    except Exception as e:
        return f"Error generating summary: {str(e)}"


# def generate_quiz(transcript, num_questions=5):
#     """
#     Generates a quiz based on a video transcript using Hugging Face Inference API.

#     Args:
#         transcript (str): The transcript text to generate a quiz from
#         num_questions (int): Number of questions to generate

#     Returns:
#         dict: A JSON-formatted quiz with questions, options, and answers
#     """
#     if not transcript or len(transcript) < 50:
#         return {"error": "Transcript too short or empty to generate quiz."}

#     system_instructions = f"""
#     You are a specialized AI quiz generator embedded in a YouTube Video Assistant browser extension. Your purpose is to create educational assessment questions based on video transcript content that test understanding and retention of key concepts. 

#     Guidelines:
#     1. Generate {num_questions} multiple-choice questions that assess comprehension of main concepts
#     2. Create questions of varying difficulty levels (recall, application, analysis)
#     3. Ensure all questions are directly answerable from the transcript content
#     4. Write clear, unambiguous questions with precise wording
#     5. Provide exactly one correct answer option and three plausible distractors
#     6. Avoid extremely obvious incorrect options that don't challenge understanding
#     7. Use consistent formatting and structure for all questions
#     8. Focus on substantive content rather than trivial details
#     9. Include questions that test conceptual understanding, not just memorization
#     10. Ensure questions and answer options are grammatically consistent
    
#     Format your response as valid JSON with the following structure:
#     {{
#       "questions": [
#         {{
#           "question": "Question text here",
#           "options": {{
#             "A": "First option",
#             "B": "Second option",
#             "C": "Third option",
#             "D": "Fourth option"
#           }},
#           "correct_answer": "A",
#           "explanation": "Explanation here"
#         }}
#       ]
#     }}
#     """

#     prompt = f"""
#     Based on the following YouTube video transcript, generate {num_questions} multiple-choice quiz questions:
      
#     TRANSCRIPT:
#     {transcript}

#     For each question:
#     1. Write a clear question that tests understanding of key concepts from the video
#     2. Provide 4 options labeled A, B, C, and D
#     3. Indicate the correct answer
#     4. Include a brief explanation of why the answer is correct
#     5. Ensure questions cover different parts or concepts from the transcript
#     6. Include at least one higher-level thinking question that requires analysis or application

#     Your response must be in valid JSON format following the structure specified in the system instructions.
#     """

#     try:
#         # Using chat completions API for better structured output
#         completion = client.chat.completions.create(
#             messages=[
#                 {"role": "system", "content": system_instructions},
#                 {"role": "user", "content": prompt},
#             ],
#             max_tokens=2048,  # Increased for more detailed quiz
#             temperature=0.7,  # Higher temperature for variety in questions
#             response_format={"type": "json_object"},  # Ensure JSON output
#         )

#         # Parse JSON response
#         quiz_json = completion.choices[0].message.content

#         # Validate the JSON structure
#         try:
#             quiz_data = json.loads(quiz_json)
#             return quiz_data
#         except json.JSONDecodeError:
#             # Fallback processing if JSON is invalid
#             return process_quiz_response(quiz_json)

#     except Exception as e:
#         return {"error": f"Error generating quiz: {str(e)}"}


# def process_quiz_response(response_text):
#     """
#     Process the raw response from the model into a structured quiz format.
#     This is a fallback in case the model doesn't output perfect JSON.
#     """
#     try:
#         # Try to extract JSON content if surrounded by markdown code blocks
#         if "```json" in response_text and "```" in response_text:
#             json_content = response_text.split("```json")[1].split("```")[0].strip()
#             return json.loads(json_content)

#         # If that doesn't work, try to find and fix common JSON issues
#         cleaned_text = response_text.strip()
#         # Remove any text before the first curly brace
#         if "{" in cleaned_text:
#             cleaned_text = cleaned_text[cleaned_text.find("{") :]
#         # Remove any text after the last curly brace
#         if "}" in cleaned_text:
#             cleaned_text = cleaned_text[: cleaned_text.rfind("}") + 1]

#         return json.loads(cleaned_text)

#     except Exception as e:
#         # Create a minimal structured response as fallback
#         return {
#             "questions": [
#                 {
#                     "question": "What is the main topic of this video?",
#                     "options": {
#                         "A": "Option based on transcript",
#                         "B": "Another option based on transcript",
#                         "C": "Third option based on transcript",
#                         "D": "Fourth option based on transcript",
#                     },
#                     "correct_answer": "A",
#                     "explanation": "Error processing quiz response: " + str(e),
#                 }
#             ]
#         }


# Example usage (for testing)
if __name__ == "__main__":
    transcript_url = "https://www.youtube.com/watch?v=wjZofJX0v4M"  # Example URL
    transcript = get_transcript(transcript_url)
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Transcript preview: {transcript[:200]}...")

    # Test summary generation
    summary = summarize_transcript(transcript)
    print("SUMMARY:")
    print(summary)

    # Test quiz generation
    # quiz = generate_quiz(transcript)
    # print("\nQUIZ:")
    # print(json.dumps(quiz, indent=2))
