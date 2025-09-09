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
      { type: "SET_API_KEY", key: apiKey },
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
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className="api-input"
        />
        <button className="save-btn" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default Setting;
