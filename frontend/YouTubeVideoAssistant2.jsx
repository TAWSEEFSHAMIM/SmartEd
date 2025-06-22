// YouTubeVideoAssistant.jsx - Fixed to match proper backend endpoints
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

// Chat component for the chat tab - calls /chat endpoint
const ChatComponent = ({ url }) => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  const askQuestion = async () => {
    if (!question.trim() || !url) return;

    setIsAsking(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url,
          question: currentQuestion 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setChatHistory(prev => [...prev, {
        question: currentQuestion,
        answer: data.answer,
        timestamp: new Date().getTime()
      }]);

    } catch (error) {
      console.error('Chat Error:', error);
      setChatHistory(prev => [...prev, {
        question: currentQuestion,
        answer: `Error: ${error.message}`,
        timestamp: new Date().getTime(),
        isError: true
      }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="chat-container">
            
      {/* Chat History */}
      <div className="chat-history">
        {chatHistory.length === 0 ? (
          <div className="chat-placeholder">
            <p>Ask any question about the video content and get detailed answers!</p>
          </div>
        ) : (
          chatHistory.map((chat, index) => (
            <div key={index} className="chat-exchange">
              <div className="chat-question">
                <strong>Q:</strong> {chat.question}
              </div>
              <div className={`chat-answer ${chat.isError ? 'chat-error' : ''}`}>
                <strong>A:</strong> {chat.answer}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about this video..."
          disabled={isAsking || !url}
          className="chat-input"
          rows={3}
        />
        <button
          onClick={askQuestion}
          disabled={isAsking || !question.trim() || !url}
          className="chat-submit-button"
        >
          {isAsking ? '' : ''}
        </button>
      </div>
    </div>
  );
};

// Summary component - calls /summarize endpoint
const SummaryComponent = ({ url, summary, setSummary }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    if (!url) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url,
          max_length: 800 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data.summary);

    } catch (error) {
      console.error('Summary Error:', error);
      setError(`Error loading summary: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!summary && url) {
      loadSummary();
    }
  }, [url]);

  return (
    <div className="summary-container">
      <h3>Video Summary</h3>
      
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading summary...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadSummary} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {summary && !isLoading && (
        <div className="mdx-editor-container">
          <MDXEditor
            markdown={summary}
            readOnly={true}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              markdownShortcutPlugin()
            ]}
          />
        </div>
      )}

      {!summary && !isLoading && !error && (
        <div className="no-content">
          <p>No summary available</p>
          <button onClick={loadSummary} className="load-button">
            Load Summary
          </button>
        </div>
      )}
    </div>
  );
};

// Quiz component - calls /quiz endpoint
const QuizComponent = ({ url, quiz, setQuiz }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQuiz = async () => {
    if (!url) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url,
          num_questions: 5 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const formattedQuiz = parseQuizData(data.quiz);
      setQuiz(formattedQuiz);

    } catch (error) {
      console.error('Quiz Error:', error);
      setError(`Error loading quiz: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((!quiz || quiz.length === 0) && url) {
      loadQuiz();
    }
  }, [url]);

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
        return parsed.questions || parsed || [];
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

  const renderQuiz = () => {
    if (!quiz || quiz.length === 0) {
      return (
        <div className="no-quiz-message">
          <p>No quiz data available.</p>
          <button onClick={loadQuiz} className="load-button">
            Generate Quiz
          </button>
        </div>
      );
    }

    return (
      <div className="interactive-quiz-container">
        <div className="quiz-header">
          <p className="quiz-subtitle">Test your understanding with these questions based on the video content.</p>
        </div>
        
        <div className="quiz-questions">
          {quiz.map((question, index) => (
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

  return (
    <div className="quiz-container">
      <h3>Knowledge Check</h3>
      
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Generating quiz...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadQuiz} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {!isLoading && renderQuiz()}
    </div>
  );
};

// Main Component - Modified for inline YouTube page integration
const YouTubeVideoAssistant2 = () => {
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

  // Process the video - calls /transcript endpoint
  const processVideo = async () => {
    if (!url.includes('youtube.com/watch')) {
      setError('Please navigate to a valid YouTube video');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Call the transcript endpoint to analyze the video
      const response = await fetch('http://127.0.0.1:8000/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // If transcript is successfully retrieved, we can proceed
      if (data.transcript) {
        // Clear any previous results to force reload from individual endpoints
        setResults(prev => ({
          ...prev,
          summary: '',
          quiz: []
        }));
        
        // Set success message
        setError('');
        
        // Expand if collapsed after successful processing
        if (isCollapsed) {
          setIsCollapsed(false);
          setCollapsedState(false);
        }
      }

    } catch (err) {
      console.error('API Error:', err);
      setError('Error processing video: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update results in state and localStorage
  const updateResults = (field, value) => {
    const newResults = {
      ...results,
      [field]: value
    };

    setResults(newResults);

    // Store results in localStorage
    if (results.videoId) {
      storeResults(results.videoId, newResults);
    }
  };

  // Render the collapsed snackbar
 const renderHeader = () => (
  <header className="extension-header">
    <div className="header-content">
      <div className="left-section">
        <h1>SmartEd</h1>
        <button
          className="collapse-button"
          onClick={toggleCollapse}
          aria-label="Collapse extension"
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      <div className="process-button-container">
        <button
          onClick={processVideo}
          disabled={isProcessing || !url}
          className="process-button"
        >
          {isProcessing ? 'Processing Video...' : 'Process This Video'}
        </button>
      </div>
    </div>
  </header>
);

const renderSnackbar = () => {
  return (
    <div className="yt-assistant-container smarted-snackbar">
      {renderHeader()}

      {error && <div className="error-message">{error}</div>}

      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <p>Processing video... This may take a minute.</p>
        </div>
      )}
    </div>
  );
};

// Final Render
if (isCollapsed) {
  return renderSnackbar();
}

return (
  <div className="yt-assistant-container">
    {renderHeader()}

    {error && <div className="error-message">{error}</div>}

    {isProcessing && (
      <div className="processing-indicator">
        <div className="spinner"></div>
        <p>Processing video... This may take a minute.</p>
      </div>
    )}

    {!isProcessing && (
      <div className="results-container">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
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

        <div className="tab-content">
          {activeTab === 'chat' && <ChatComponent url={url} />}
          {activeTab === 'summary' && (
            <SummaryComponent
              url={url}
              summary={results.summary}
              setSummary={(summary) => updateResults('summary', summary)}
            />
          )}
          {activeTab === 'quiz' && (
            <QuizComponent
              url={url}
              quiz={results.quiz}
              setQuiz={(quiz) => updateResults('quiz', quiz)}
            />
          )}
        </div>
      </div>
    )}

    <footer className="extension-footer">
      <p>© 2025 SmartEd. All rights reserved.</p>
    </footer>
  </div>
);
};

export default YouTubeVideoAssistant2;