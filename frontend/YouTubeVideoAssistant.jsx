// YouTubeVideoAssistant.jsx - Modified for content script integration
import React, { useState, useEffect } from 'react';
import './style.css';

// Main Component - Modified for inline YouTube page integration
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

  // Get current YouTube URL when component mounts
  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('youtube.com/watch')) {
      setUrl(currentUrl);
      extractVideoId(currentUrl);
    }
    
    // Listen for URL changes within the component
    const handleLocationChange = () => {
      const newUrl = window.location.href;
      if (newUrl.includes('youtube.com/watch')) {
        setUrl(newUrl);
        extractVideoId(newUrl);
      }
    };
    
    // Set up a MutationObserver to detect YouTube's navigation
    const observer = new MutationObserver((mutations) => {
      if (window.location.href !== url && window.location.href.includes('youtube.com/watch')) {
        handleLocationChange();
      }
    });
    
    observer.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Extract video ID and fetch video details
  const extractVideoId = (url) => {
    try {
      const urlParams = new URLSearchParams(new URL(url).search);
      const videoId = urlParams.get('v');
      
      if (videoId) {
        // Get video title from the page
        const title = document.title.replace(' - YouTube', '');
        
        setResults(prev => ({
          ...prev,
          videoId,
          videoTitle: title,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`
        }));
      }
    } catch (err) {
      console.error('Error extracting video ID:', err);
    }
  };

  // Process the video when user clicks the button
  const processVideo = async () => {
    if (!url.includes('youtube.com/watch')) {
      setError('Please navigate to a valid YouTube video');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      // Call your backend API
      const response = await fetch('http://127.0.0.1:8000/complete-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Results available immediately since we're not using polling
      updateResults(data);
      setIsProcessing(false);
    } catch (err) {
      console.error('API Error:', err);
      setError('Error processing video: ' + err.message);
      setIsProcessing(false);
    }
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
        <h1>SmartEd</h1>
      </header>
      
      {/* Process Button */}
      <div className="process-button-container">
        <button 
          onClick={processVideo} 
          disabled={isProcessing || !url}
          className="process-button full-width"
        >
          {isProcessing ? 'Processing Video...' : 'Analyze This Video'}
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