import React, { useState } from "react";

const KeyOption = ({ onClose, onSave }) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError("");

    // Send message with correct type that matches background.ts
    chrome.runtime.sendMessage(
      { type: "SAVE_API_KEY", apiKey: apiKey.trim() },
      (response) => {
        setIsLoading(false);
        
        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response?.success) {
          console.log("API key saved successfully");
          onSave(apiKey.trim()); // Call parent callback
          onClose(); // Close the modal
        } else {
          setError(response?.error || "Failed to save API key");
        }
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="key-option-container">
      <button className="close-btn" onClick={onClose}>✕</button>
      <h2>Enter Your Google API Key</h2>
      
      <input
        type="password"
        placeholder="Please enter your GOOGLE API KEY"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        onKeyPress={handleKeyPress}
        className="api-input"
        disabled={isLoading}
      />
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '8px' }}>
          {error}
        </div>
      )}
      
      <p className="description">
        Your API key is stored securely in your browser. It never leaves your device.
      </p>
      
      <a 
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="guide-link"
      >
        How to get your API key?
      </a>
      
      <button 
        className="save-btn" 
        onClick={handleSave}
        disabled={isLoading || !apiKey.trim()}
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default KeyOption;