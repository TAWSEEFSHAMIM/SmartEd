import React, { useState, useEffect } from "react";

const Setting = ({ currentTheme, setTheme, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_API_KEY" }, (response) => {
      if (response?.key) setApiKey(response.key);
    });
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    chrome.runtime.sendMessage(
      { type: "SAVE_API_KEY", apiKey: apiKey.trim() },
      (response) => {
        setIsLoading(false);

        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        if (response?.success) {
          setSuccess(true);
          setError("");
          // Optionally close settings after save
          // onClose();
        } else {
          setError(response?.error || "Failed to save API key");
        }
      }
    );
  };

  return (
    <div className="settings-container">
      <button className="close-btn" onClick={onClose}>← Back</button>
      <h2>Settings</h2>

      <div className="theme-setting">
        <label>Theme:</label>
        <button onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}>
          {currentTheme === "dark" ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>

      <div className="api-key-setting">
        <label>Google API Key:</label>
        <div className="api-input-group">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="api-input"
          />
          <div className="api-key-actions">
            <button 
              className="save-btn" 
              onClick={handleSave}
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
            {apiKey && (
<span 
  className="delete-btn cursor-pointer" 
  onClick={() => {
    if (window.confirm("Are you sure you want to delete your API key?")) {
      chrome.runtime.sendMessage({ type: "DELETE_API_KEY" }, (response) => {
        if (response.success) {
          setApiKey("");
          console.log("API key deleted!");
        }
      });
    }
  }}
  title="Delete API Key"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 28 30">
    <path fill="currentColor" d="M14 12.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0zm4.5-.5a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m2-5.5V7h8a.5.5 0 0 1 0 1h-2.543l-1.628 17.907A4.5 4.5 0 0 1 19.847 30h-7.694a4.5 4.5 0 0 1-4.482-4.093L6.043 8H3.5a.5.5 0 0 1 0-1h8v-.5a4.5 4.5 0 1 1 9 0m-8 0V7h7v-.5a3.5 3.5 0 1 0-7 0M7.048 8l1.62 17.817A3.5 3.5 0 0 0 12.152 29h7.694a3.5 3.5 0 0 0 3.486-3.183L24.953 8z"/>
  </svg>
</span>

            )}
          </div>
        </div>
        {error && <div className="error-message" style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
        {success && <div className="success-message" style={{ color: 'green', marginTop: '8px' }}>API key saved successfully!</div>}
      </div>
    </div>
  );
};

export default Setting;
