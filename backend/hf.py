from transformers import pipeline

from transcript import get_transcript
from huggingface_hub import login

# Login to Hugging Face Hub
login(token="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")

# For summarization
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6", 
                     device=0,  # Use GPU
                     )  # Half precision to save memory


if __name__ == "__main__":
    transcript_url = "https://www.youtube.com/watch?v=0XSDAup85SA"  # Example URL
    transcript = get_transcript(transcript_url)
    print(f"Transcript length: {len(transcript)} characters")
    print(f"Transcript preview: {transcript[:200]}...")

    # Split the transcript into manageable chunks
    # Each chunk should be less than the model's maximum sequence length (1024 tokens)
    # A rough estimate is around 4 characters per token
    max_chunk_size = 900 * 4  # Using 900 instead of 1024 to be safe
    chunks = [transcript[i:i + max_chunk_size] for i in range(0, len(transcript), max_chunk_size)]
    
    # Process each chunk and combine the summaries
    summaries = []
    for i, chunk in enumerate(chunks):
        print(f"Processing chunk {i+1}/{len(chunks)}")
        summary = summarizer(chunk, max_length=200, min_length=30, do_sample=False)
        summaries.append(summary[0]['summary_text'])
    
    # Combine the summaries
    combined_summary = " ".join(summaries)
    print("\nFinal Summary:")
    print(combined_summary)
