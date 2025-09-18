import React, { useState, useEffect } from "react";

const Setting = ({ currentTheme, setTheme, onClose }) => {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_API_KEY" }, (response) => {
      if (response?.key) setApiKey(response.key);
    });
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    chrome.runtime.sendMessage(
      { type: "SAVE_API_KEY", apiKey: apiKey.trim() },
      (response) => {
        if (response.success) {
          console.log("API key updated!");
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
              disabled={!apiKey.trim()}
            >
              Save
            </button>
            {apiKey && (
              <button 
                className="delete-btn" 
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
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
