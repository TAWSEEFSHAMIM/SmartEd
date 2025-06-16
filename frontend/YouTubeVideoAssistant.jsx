// YouTubeVideoAssistant.jsx - Modified for content script integration with collapsible UI
import React, { useState, useEffect } from 'react';
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'; // Import the editor styles
import './style.css';

// Interactive Quiz Question Component
const QuizQuestion = ({ question, questionIndex }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedOption('');
    setIsSubmitted(false);
    setShowResult(false);
  };

  const isCorrect = selectedOption === question.correct_answer;

  return (
    <div className="quiz-question-card">
      <div className="quiz-question-header">
        <h4>Question {questionIndex + 1}</h4>
      </div>
      
      <div className="quiz-question-text">
        <p>{question.question}</p>
      </div>

      <div className="quiz-options">
        {Object.entries(question.options).map(([optionKey, optionText]) => (
          <label
            key={optionKey}
            className={`quiz-option-label ${
              showResult ? (
                optionKey === question.correct_answer ? 'correct-answer' :
                optionKey === selectedOption ? 'incorrect-answer' : ''
              ) : ''
            } ${selectedOption === optionKey ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name={`question-${questionIndex}`}
              value={optionKey}
              checked={selectedOption === optionKey}
              onChange={(e) => setSelectedOption(e.target.value)}
              disabled={isSubmitted}
              className="quiz-option-input"
            />
            <div className="quiz-option-content">
              <span className="option-letter">{optionKey}</span>
              <span className="option-text">{optionText}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="quiz-question-actions">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="quiz-submit-button"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="quiz-reset-button"
          >
            Try Again
          </button>
        )}
      </div>

      {showResult && (
        <div className={`quiz-result ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="result-header">
            {isCorrect ? (
              <span className="result-icon correct-icon">✓</span>
            ) : (
              <span className="result-icon incorrect-icon">✗</span>
            )}
            <span className="result-text">
              {isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${question.correct_answer}.`}
            </span>
          </div>
          {question.explanation && (
            <div className="result-explanation">
              <p><strong>Explanation:</strong> {question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple markdown parser component
const SimpleMarkdown = ({ content }) => {
  if (!content) return null;

  // Split content into paragraphs
  const paragraphs = content.split('\n\n');

  return (
    <div className="simple-markdown">
      {paragraphs.map((paragraph, index) => {
        // Handle headers
        if (paragraph.startsWith('# ')) {
          return <h1 key={index}>{paragraph.substring(2)}</h1>;
        } else if (paragraph.startsWith('## ')) {
          return <h2 key={index}>{paragraph.substring(3)}</h2>;
        } else if (paragraph.startsWith('### ')) {
          return <h3 key={index}>{paragraph.substring(4)}</h3>;
        }

        // Handle lists
        if (paragraph.includes('\n- ')) {
          const listItems = paragraph.split('\n- ').filter(item => item);
          return (
            <ul key={index}>
              {listItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }

        // Handle numbered lists
        if (/\n\d+\.\s/.test(paragraph)) {
          const listItems = paragraph.split(/\n\d+\.\s/).filter(item => item);
          return (
            <ol key={index}>
              {listItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          );
        }

        // Simple paragraph with basic formatting
        const formattedText = formatTextInline(paragraph);
        return <p key={index}>{formattedText}</p>;
      })}
    </div>
  );
};

// Helper function to format inline text (bold, italic)
const formatTextInline = (text) => {
  // We'll use a simple approach for inline formatting
  // This won't handle nested formatting but works for basic cases

  // Convert parts wrapped in ** to bold
  let elements = [];
  let lastIndex = 0;
  let boldRegex = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    elements.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  // If no bold formatting was found, just return the text
  if (elements.length === 0) {
    return text;
  }

  return elements;
};

// Helper functions for localStorage
const getStoredResults = (videoId) => {
  try {
    const stored = localStorage.getItem(`smarted_results_${videoId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

const storeResults = (videoId, results) => {
  try {
    localStorage.setItem(`smarted_results_${videoId}`, JSON.stringify({
      ...results,
      timestamp: new Date().getTime()
    }));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

// Store UI collapsed state
const getCollapsedState = () => {
  try {
    return localStorage.getItem('smarted_collapsed') === 'true';
  } catch (error) {
    console.error('Error reading collapsed state from localStorage:', error);
    return false;
  }
};

const setCollapsedState = (isCollapsed) => {
  try {
    localStorage.setItem('smarted_collapsed', isCollapsed.toString());
  } catch (error) {
    console.error('Error writing collapsed state to localStorage:', error);
  }
};

// Main Component - Modified for inline YouTube page integration
const YouTubeVideoAssistant = () => {
  // State management
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isCollapsed, setIsCollapsed] = useState(getCollapsedState());
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

  // Cleanup old stored results
  useEffect(() => {
    // Cleanup function
    return () => {
      // Clear stored results older than 24 hours
      const yesterday = new Date().getTime() - (24 * 60 * 60 * 1000);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('smarted_results_')) {
          try {
            const stored = JSON.parse(localStorage.getItem(key));
            if (stored.timestamp && stored.timestamp < yesterday) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.error('Error cleaning up localStorage:', e);
          }
        }
      });
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

        // Try to load stored results
        const storedResults = getStoredResults(videoId);
        if (storedResults) {
          setResults({
            ...storedResults,
            videoId,
            videoTitle: title,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`
          });
        } else {
          setResults(prev => ({
            ...prev,
            videoId,
            videoTitle: title,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/0.jpg`
          }));
        }
      }
    } catch (err) {
      console.error('Error extracting video ID:', err);
    }
  };

  // Toggle collapsed state 
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    setCollapsedState(newState);
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
    // Parse quiz data from JSON format
    const formattedQuiz = parseQuizData(result.quiz);

    const newResults = {
      ...results,
      summary: result.summary,
      quiz: formattedQuiz
    };

    setResults(newResults);

    // Store results in localStorage
    if (results.videoId) {
      storeResults(results.videoId, newResults);
    }
  };

  // Parse quiz data from JSON format
  const parseQuizData = (quizData) => {
    try {
      console.log("Parsing quiz data:", quizData);
      
      // If quizData is a string, it might be wrapped in markdown code blocks
      if (typeof quizData === 'string') {
        let cleanedData = quizData.trim();
        
        // Remove markdown code block markers if present
        if (cleanedData.startsWith('```json')) {
          cleanedData = cleanedData.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleanedData.startsWith('```')) {
          cleanedData = cleanedData.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Try to parse the cleaned JSON
        const parsed = JSON.parse(cleanedData);
        console.log("Parsed quiz data:", parsed);
        return parsed.questions || [];
      }
      
      // If it's already an object, check if it has questions property
      if (quizData && quizData.questions) {
        return quizData.questions;
      }
      
      // If it's already an array of questions
      if (Array.isArray(quizData)) {
        return quizData;
      }
      
      return [];
    } catch (e) {
      console.error("Error parsing quiz data:", e);
      console.error("Raw quiz data:", quizData);
      return [];
    }
  };

  // Render quiz questions with interactive UI
  const renderQuiz = () => {
    if (!results.quiz || results.quiz.length === 0) {
      return (
        <div className="no-quiz-message">
          <p>No quiz data available. Process a video to generate quiz questions.</p>
        </div>
      );
    }

    return (
      <div className="interactive-quiz-container">
        <div className="quiz-header">
          <p className="quiz-subtitle">Test your understanding with these questions based on the video content.</p>
        </div>
        
        <div className="quiz-questions">
          {results.quiz.map((question, index) => (
            <QuizQuestion
              key={index}
              question={question}
              questionIndex={index}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render the collapsed snackbar
  const renderSnackbar = () => {
    return (
      <div className="yt-assistant-container">
        <header className="extension-header">
          <div className="header-content">
            <h1>SmartEd</h1>
            <button
              className={`collapse-button ${isCollapsed ? 'collapse-button-rotate' : ''}`}
              onClick={toggleCollapse}
              aria-label="Collapse extension"
            >
              &#x25BC;
            </button>
          </div>
        </header>

        {/* Process Button */}
        <div className="process-button-container">
          <button
            onClick={() => {
              processVideo();
              toggleCollapse();
            }}
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

      </div>
    );
  };

  // If collapsed, only render the snackbar
  if (isCollapsed) {
    return renderSnackbar();
  }

  // Render full extension UI if not collapsed
  return (
    <div className="yt-assistant-container">
      <header className="extension-header">
        <div className="header-content">
          <h1>SmartEd</h1>
          <button
            className="collapse-button"
            onClick={toggleCollapse}
            aria-label="Collapse extension"
          >
            &#x25BC;
          </button>
        </div>
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
              Quiz ({results.quiz.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'summary' && (
              <div className="summary-container">
                <h3>Video Summary</h3>
                {results.summary ? (
                  <div className="mdx-editor-container">
                    <MDXEditor
                      markdown={results.summary}
                      readOnly={true}
                      plugins={[
                        headingsPlugin(),
                        listsPlugin(),
                        quotePlugin(),
                        markdownShortcutPlugin()
                      ]}
                    />
                  </div>
                ) : (
                  <p>No summary available</p>
                )}
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
        <p>Powered by Gemini</p>
      </footer>
    </div>
  );
};

export default YouTubeVideoAssistant;