// YouTubeVideoAssistant.jsx - Modified for content script integration with collapsible UI
import React, { useState, useEffect } from 'react';
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'; // Import the editor styles
import './style.css';
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
    // Format quiz data from raw text to structured format
    const formattedQuiz = formatQuizData(result.quiz);

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
              Quiz
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
        <p>Powered by open-source NLP models</p>
      </footer>
    </div>
  );
};

export default YouTubeVideoAssistant;