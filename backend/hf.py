from transformers import pipeline

from transcript import get_transcript
from huggingface_hub import login

# Login to Hugging Face Hub
login(token="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")

# For summarization
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", 
                     device=0,  # Use GPU
                     fp16=True)  # Half precision to save memory


# Example usage (for testing)
if __name__ == "__main__":
    transcript_url = "https://www.youtube.com/watch?v=wjZofJX0v4M"  # Example URL
    transcript = get_transcript(transcript_url)
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Transcript preview: {transcript[:200]}...")

    # Test summary generation
    print(summarizer(transcript, max_length=130, min_length=30, do_sample=False))