// YouTubeVideoAssistant.jsx - Fixed to match proper backend endpoints
import React, { useState, useEffect, useRef } from 'react';
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'; // Import the editor styles
import './style.css';
import Setting from "./setting.jsx";
import KeyOption from "./keyOption.jsx";

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
const ChatComponent = ({ url, getUserApiKey }) => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom whenever chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Auto-resize textarea up to 4 lines
  useEffect(() => {
    if (textareaRef.current) {
      const lineHeight = 24; // Adjust if your CSS line-height is different
      const maxRows = 4;
      textareaRef.current.rows = 1;
      const lines = question.split('\n').length;
      const scrollRows = Math.min(
        maxRows,
        Math.max(1, Math.ceil(textareaRef.current.scrollHeight / lineHeight))
      );
      textareaRef.current.rows = scrollRows;
      textareaRef.current.style.overflowY = scrollRows === maxRows ? 'auto' : 'hidden';
    }
  }, [question]);

  const askQuestion = async () => {
    if (!question.trim() || !url) return;

    setIsAsking(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const userApiKey = await getUserApiKey();
      if (!userApiKey) {
        setChatHistory(prev => [...prev, {
          question: currentQuestion,
          answer: 'No API key found. Open Settings to add your Gemini API key.',
          timestamp: new Date().getTime(),
          isError: true
        }]);
        setIsAsking(false);
        return;
      }

      const payload = {
        url,
        question: currentQuestion,
        history: chatHistory.map(chat => ({
          question: chat.question,
          answer: chat.answer
        }))
      };

      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': userApiKey },
        body: JSON.stringify(payload)
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
      {/* existing UI rendering unchanged */}
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

      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about this video..."
          disabled={isAsking || !url}
          className="chat-input"
          rows={1}
          style={{
            resize: 'none',
            maxHeight: `${4 * 24}px`, // 4 lines max, adjust lineHeight if needed
            overflowY: 'auto'
          }}
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
const SummaryComponent = ({ url, summary, setSummary, getUserApiKey }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus('error');
    }
  };

  const loadSummary = async () => {
    if (!url) return;

    setIsLoading(true);
    setError('');

    try {
      const userApiKey = await getUserApiKey();
      if (!userApiKey) {
        setError('No API key found. Open Settings to add your Gemini API key.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/summarize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': userApiKey
        },
        body: JSON.stringify({ url: url, max_length: 800 })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="summary-container">
      <div className="summary-header">
        
        <button 
          onClick={handleCopy}
          className={`copy-button ${copyStatus}`}
          aria-label="Copy"
          title="Copy"
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            marginLeft: 8,
            transition: 'background 0.2s',
            outline: 'none',
            padding: 0
          }}
        >
          {copyStatus === 'copied' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4caf50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
              <polyline points="2 7 6 11 12 3"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path fill="#000" d="M15.24 2h-3.894c-1.764 0-3.162 0-4.255.148c-1.126.152-2.037.472-2.755 1.193c-.719.721-1.038 1.636-1.189 2.766C3 7.205 3 8.608 3 10.379v5.838c0 1.508.92 2.8 2.227 3.342c-.067-.91-.067-2.185-.067-3.247v-5.01c0-1.281 0-2.386.118-3.27c.127-.948.413-1.856 1.147-2.593s1.639-1.024 2.583-1.152c.88-.118 1.98-.118 3.257-.118h3.07c1.276 0 2.374 0 3.255.118A3.6 3.6 0 0 0 15.24 2"/>
              <path fill="#000" d="M6.6 11.397c0-2.726 0-4.089.844-4.936c.843-.847 2.2-.847 4.916-.847h2.88c2.715 0 4.073 0 4.917.847S21 8.671 21 11.397v4.82c0 2.726 0 4.089-.843 4.936c-.844.847-2.202.847-4.917.847h-2.88c-2.715 0-4.073 0-4.916-.847c-.844-.847-.844-2.21-.844-4.936z"/>
            </svg>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="content-loading-indicator">
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
            contentEditableClassName="mdx-editor-content"
            theme={document.body.classList.contains('smarted-dark') ? 'dark' : 'light'}
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
const QuizComponent = ({ url, quiz, setQuiz, getUserApiKey }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQuiz = async () => {
    if (!url) return;

    setIsLoading(true);
    setError('');

    try {
      const userApiKey = await getUserApiKey();
      if (!userApiKey) {
        setError('No API key found. Open Settings to add your Gemini API key.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/quiz', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': userApiKey
        },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <h2>Knowledge Check</h2>

      {isLoading && (
        <div className="content-loading-indicator">
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

const THEME_KEY = 'smarted_theme';

// Main Component - Modified for inline YouTube page integration
const Smarted = () => {
  // State management
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const chatContainerRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(getCollapsedState());
  const [results, setResults] = useState({
    summary: '',
    quiz: [],
    videoTitle: '',
    videoId: '',
    thumbnailUrl: ''
  });
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyOption, setShowKeyOption] = useState(false);
  const apiKeyRef = useRef(null);

  // getUserApiKey helper (component scope)
  const getUserApiKey = async () => {
    if (apiKeyRef.current) return apiKeyRef.current;

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_API_KEY" }, (response) => {
        const key = response?.key || null;
        if (key) apiKeyRef.current = key;
        resolve(key);
      });
    });
  };

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );

  // Auto-scroll effect
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    document.body.classList.toggle('smarted-dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_API_KEY" }, (response) => {
      if (!response?.key) {
        setShowKeyOption(true);
      }
    });
  }, []);

  // Listen for API_KEY_CHANGED from background and update cached key
  useEffect(() => {
    const handler = (msg) => {
      if (msg?.type === "API_KEY_CHANGED") {
        apiKeyRef.current = msg.key || null;
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => {
      try {
        chrome.runtime.onMessage.removeListener(handler);
      } catch (e) {
        // ignore if runtime not available in test env
      }
    };
  }, []);

  // Get current YouTube URL when component mounts and watch for navigation
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
    const observer = new MutationObserver(() => {
      if (window.location.href !== url && window.location.href.includes('youtube.com/watch')) {
        handleLocationChange();
      }
    });

    const titleEl = document.querySelector('title');
    if (titleEl) {
      observer.observe(titleEl, { subtree: true, characterData: true, childList: true });
    }

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
      const userApiKey = await getUserApiKey();
      if (!userApiKey) {
        setShowKeyOption(true);
        setIsProcessing(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/transcript', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': userApiKey
        },
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
    <div className={`yt-assistant-container${theme === 'dark' ? ' smarted-dark' : ''}`}>
      {showKeyOption ? (
        <div className="content-wrapper">
          <KeyOption
            onClose={() => setShowKeyOption(false)}
            onSave={() => setShowKeyOption(false)}
          />
        </div>
      ) : showSettings ? (
        <div className="content-wrapper">
          <Setting
            currentTheme={theme}
            setTheme={setTheme}
            onClose={() => setShowSettings(false)}
          />
        </div>
      ) : (
        <>
          {renderHeader()}

          {isProcessing ? (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processing video... This may take a minute.</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <div className="error-content">
                  <h3>Error Occurred</h3>
                  <p>{error}</p>
                  <button 
                    className="retry-button"
                    onClick={processVideo}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
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
                {activeTab === 'chat' && (
                  <ChatComponent url={url} getUserApiKey={getUserApiKey} />
                )}

                {activeTab === 'summary' && (
                  <SummaryComponent
                    url={url}
                    summary={results.summary}
                    setSummary={(summary) => updateResults('summary', summary)}
                    getUserApiKey={getUserApiKey}
                  />
                )}

                {activeTab === 'quiz' && (
                  <QuizComponent
                    url={url}
                    quiz={results.quiz}
                    setQuiz={(quiz) => updateResults('quiz', quiz)}
                    getUserApiKey={getUserApiKey}
                  />
                )}
              </div>

            </div>
          )}

          <footer
            className="extension-footer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <p style={{ margin: 0 }}>© 2025 SmartEd. All rights reserved.</p>
            <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 0 24 24"
  className="settings-icon"
  onClick={() => setShowSettings(true)}
  role="button"
  tabIndex={0}
  aria-label="Open settings"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowSettings(true);
    }
  }}
  style={{ cursor: 'pointer' }}
>
  <path fill="currentColor" d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17ZM18.41 14l.8.9l-1.28 2.22l-1.18-.24a3 3 0 0 0-3.45 2L12.92 20h-2.56L10 18.86a3 3 0 0 0-3.45-2l-1.18.24l-1.3-2.21l.8-.9a3 3 0 0 0 0-4l-.8-.9l1.28-2.2l1.18.24a3 3 0 0 0 3.45-2L10.36 4h2.56l.38 1.14a3 3 0 0 0 3.45 2l1.18-.24l1.28 2.22l-.8.9a3 3 0 0 0 0 3.98m-6.77-6a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/>
</svg>
          </footer>
        </>
      )}
    </div>
  );
};

export default Smarted;
