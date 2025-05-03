// YouTube Video Assistant Extension UI
// Built with Plasma HQ and React

import React, { useState, useEffect } from 'react';
import './style.css';

// Main Extension Component
const YouTubeVideoAssistant = () => {
  // State management
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [results, setResults] = useState({
    summary: '',
    quiz: [],
    videoTitle: '',
    videoId: '',
    thumbnailUrl: ''
  });
  const [error, setError] = useState('');

  // Get current YouTube URL when extension opens
  useEffect(() => {
    // Chrome extension API to get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('youtube.com/watch')) {
        setUrl(tabs[0].url);
        extractVideoId(tabs[0].url);
      }
    });
  }, []);

  // Extract video ID and fetch video details
  const extractVideoId = (url) => {
    const urlParams = new URLSearchParams(new URL(url).search);
    const videoId = urlParams.get('v');
    
    if (videoId) {
      setResults(prev => ({
        ...prev,
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`
      }));
      
      // Get video title via YouTube Data API or from page title
      chrome.tabs.executeScript(
        { code: 'document.title' },
        (results) => {
          const title = results[0].replace(' - YouTube', '');
          setResults(prev => ({ ...prev, videoTitle: title }));
        }
      );
    }
  };

  // Process the video when user clicks the button
  const processVideo = async () => {
    if (!url.includes('youtube.com/watch')) {
      setError('Please enter a valid YouTube video URL');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Call your backend API
      const response = await fetch('https://your-backend-api.com/process-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process video');
      }
      
      const data = await response.json();
      
      // Check if we need to poll for results
      if (data.status === 'processing') {
        pollForResults(data.request_id);
      } else {
        // Results available immediately
        updateResults(data.result);
      }
    } catch (err) {
      setError('Error processing video: ' + err.message);
      setIsProcessing(false);
    }
  };
  
  // Poll for results if processing asynchronously
  const pollForResults = async (requestId) => {
    const checkResults = async () => {
      try {
        const response = await fetch(`https://your-backend-api.com/result/${requestId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          updateResults(data.result);
          setIsProcessing(false);
          return true;
        } else if (data.status === 'failed') {
          setError('Processing failed: ' + data.error);
          setIsProcessing(false);
          return true;
        }
        // Still processing
        return false;
      } catch (err) {
        setError('Error checking results: ' + err.message);
        setIsProcessing(false);
        return true;
      }
    };
    
    // Poll every 3 seconds until complete
    const pollInterval = setInterval(async () => {
      const isDone = await checkResults();
      if (isDone) clearInterval(pollInterval);
    }, 3000);
  };
  
  // Update results in state
  const updateResults = (result) => {
    // Format quiz data from raw text to structured format
    const formattedQuiz = formatQuizData(result.quiz);
    
    setResults(prev => ({
      ...prev,
      summary: result.summary,
      quiz: formattedQuiz
    }));
  };
  
  // Format quiz text into structured data
  const formatQuizData = (quizText) => {
    // Simple parsing - in production you'd want more robust parsing
    try {
      const questions = quizText.split(/Question \d+:/).filter(q => q.trim().length > 0);
      
      return questions.map(q => {
        // Extract question text
        const questionText = q.split(/[A-D]:/)[0].trim();
        
        // Extract options
        const options = [];
        const optionMatches = q.match(/[A-D]: (.*?)(?=(?:[A-D]:|Correct Answer:|$))/gs);
        
        if (optionMatches) {
          optionMatches.forEach(option => {
            const [letter, text] = option.split(':').map(s => s.trim());
            options.push({ letter, text });
          });
        }
        
        // Extract correct answer
        let correctAnswer = '';
        const answerMatch = q.match(/Correct Answer: ([A-D])/);
        if (answerMatch) {
          correctAnswer = answerMatch[1];
        }
        
        return { questionText, options, correctAnswer };
      });
    } catch (e) {
      console.error("Error parsing quiz data:", e);
      return [];
    }
  };

  // Render quiz questions
  const renderQuiz = () => {
    if (!results.quiz || results.quiz.length === 0) {
      return <p>No quiz data available</p>;
    }
    
    return (
      <div className="quiz-container">
        {results.quiz.map((question, qIndex) => (
          <div key={qIndex} className="quiz-question">
            <h4>Question {qIndex + 1}</h4>
            <p>{question.questionText}</p>
            
            <div className="quiz-options">
              {question.options.map((option, oIndex) => (
                <div 
                  key={oIndex} 
                  className={`quiz-option ${option.letter === question.correctAnswer ? 'correct' : ''}`}
                >
                  <span className="option-letter">{option.letter}</span>
                  <span className="option-text">{option.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="yt-assistant-container">
      <header className="extension-header">
        <h1>YouTube Video Assistant</h1>
      </header>
      
      {/* Video Info Section */}
      {results.thumbnailUrl && (
        <div className="video-info">
          <img src={results.thumbnailUrl} alt="Video thumbnail" className="video-thumbnail" />
          <div className="video-details">
            <h3>{results.videoTitle || 'YouTube Video'}</h3>
          </div>
        </div>
      )}
      
      {/* URL Input */}
      <div className="url-input-container">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="YouTube URL"
          className="url-input"
          disabled={isProcessing}
        />
        <button 
          onClick={processVideo} 
          disabled={isProcessing || !url}
          className="process-button"
        >
          {isProcessing ? 'Processing...' : 'Process Video'}
        </button>
      </div>
      
      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <p>Processing video... This may take a minute.</p>
        </div>
      )}
      
      {/* Results Section */}
      {!isProcessing && (results.summary || results.quiz.length > 0) && (
        <div className="results-container">
          {/* Tab Navigation */}
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button 
              className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              Quiz
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'summary' && (
              <div className="summary-container">
                <h3>Video Summary</h3>
                <p>{results.summary || 'No summary available'}</p>
              </div>
            )}
            
            {activeTab === 'quiz' && (
              <div className="quiz-container">
                <h3>Knowledge Check</h3>
                {renderQuiz()}
              </div>
            )}
          </div>
        </div>
      )}
      
      <footer className="extension-footer">
        <p>Powered by open-source NLP models</p>
      </footer>
    </div>
  );
};

export default YouTubeVideoAssistant;