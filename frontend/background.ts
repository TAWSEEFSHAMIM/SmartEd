console.log("✅ Background worker loaded (SmartEd)");

chrome.runtime.onInstalled.addListener(() => {
  console.log("📦 SmartEd Extension installed");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 Received:", msg);

  // Keep existing test handlers
  if (msg.type === "PING") {
    sendResponse({ pong: true });
    return true;
  }

  if (msg.type === "SAVE") {
    try {
      chrome.storage.local.set({ testKey: "hello" }, () => {
        console.log("💾 Saved testKey");
        sendResponse({ success: true });
      });
    } catch (err) {
      console.error("❌ storage.local failed:", err);
      sendResponse({ success: false, error: err.toString() });
    }
    return true;
  }

  if (msg.type === "LOAD") {
    chrome.storage.local.get("testKey", (data) => {
      console.log("🔑 Loaded testKey:", data);
      sendResponse({ key: data.testKey || null });
    });
    return true;
  }

  // API Key Management
  if (msg.type === "GET_API_KEY") {
    chrome.storage.local.get("userApiKey", (data) => {
      console.log("🔑 Retrieved API key:", data.userApiKey ? "***found***" : "not found");
      sendResponse({ key: data.userApiKey || null });
    });
    return true;
  }

  if (msg.type === "SAVE_API_KEY") {
    const { apiKey } = msg;
    if (!apiKey || typeof apiKey !== "string") {
      sendResponse({ success: false, error: "Invalid API key" });
      return true;
    }

    try {
      chrome.storage.local.set({ userApiKey: apiKey }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Failed to save API key:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log("💾 API key saved successfully");
          sendResponse({ success: true });

          // Broadcast API key change to all content scripts
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { 
                  type: "API_KEY_CHANGED", 
                  key: apiKey 
                }).catch(() => {
                  // Ignore errors for tabs that don't have content scripts
                });
              }
            });
          });
        }
      });
    } catch (err) {
      console.error("❌ Error saving API key:", err);
      sendResponse({ success: false, error: err.toString() });
    }
    return true;
  }

  if (msg.type === "DELETE_API_KEY") {
    try {
      chrome.storage.local.remove("userApiKey", () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Failed to delete API key:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log("🗑️ API key deleted successfully");
          sendResponse({ success: true });

          // Broadcast API key removal to all content scripts
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { 
                  type: "API_KEY_CHANGED", 
                  key: null 
                }).catch(() => {
                  // Ignore errors for tabs that don't have content scripts
                });
              }
            });
          });
        }
      });
    } catch (err) {
      console.error("❌ Error deleting API key:", err);
      sendResponse({ success: false, error: err.toString() });
    }
    return true;
  }

  // Handle unknown message types
  console.warn("⚠️ Unknown message type:", msg.type);
  sendResponse({ success: false, error: "Unknown message type" });
  return true;
});