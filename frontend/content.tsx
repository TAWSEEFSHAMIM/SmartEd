// content.js - This script will be injected into YouTube pages
import React from 'react';
import { createRoot } from 'react-dom/client';
import YouTubeVideoAssistant from './YouTubeVideoAssistant.jsx';
import './style.css';

// Function to check if we're on a YouTube video page
function isYouTubeVideoPage() {
  return window.location.href.includes('youtube.com/watch');
}

// Create and insert our extension container
function insertExtensionContainer() {
  // Check if our container already exists
  if (document.getElementById('smart-ed-extension-container')) {
    return;
  }

  // Find the element to insert next to - YouTube's secondary column (sidebar)
  const secondaryColumn = document.querySelector('#secondary');
  
  if (!secondaryColumn) {
    console.error('Could not find YouTube secondary column to attach to');
    return;
  }
  
  // Create our container
  const container = document.createElement('div');
  container.id = 'smart-ed-extension-container';
  
  // Insert our container before the secondary column
  secondaryColumn.parentNode.insertBefore(container, secondaryColumn);
  
  // Render our React component into the container
  const root = createRoot(container);
  root.render(<YouTubeVideoAssistant />);
}

// Function to handle URL changes (for YouTube's SPA navigation)
function handleURLChange() {
  if (isYouTubeVideoPage()) {
    // Give YouTube a moment to render its UI
    setTimeout(insertExtensionContainer, 1000);
  } else {
    // Remove our container if we're not on a video page
    const container = document.getElementById('smart-ed-extension-container');
    if (container) {
      container.remove();
    }
  }
}

// Initial check when content script loads
if (isYouTubeVideoPage()) {
  // Wait for YouTube to fully render
  window.addEventListener('load', () => {
    setTimeout(insertExtensionContainer, 1000);
  });
  
  // If the page is already loaded
  if (document.readyState === 'complete') {
    setTimeout(insertExtensionContainer, 1000);
  }
}

// Listen for YouTube's navigation events (it's a single-page app)
// We need to detect when the user navigates to a video page
const pushStateOriginal = history.pushState;
history.pushState = function() {
  pushStateOriginal.apply(this, arguments);
  handleURLChange();
};

const replaceStateOriginal = history.replaceState;
history.replaceState = function() {
  replaceStateOriginal.apply(this, arguments);
  handleURLChange();
};

// Listen for popstate events (back/forward browser navigation)
window.addEventListener('popstate', handleURLChange);