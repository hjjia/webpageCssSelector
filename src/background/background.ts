// Background script for Chrome extension
import { isUrlRestricted, getUrlRestrictionMessage, canExecuteOnUrl } from '../utils/urlConfig';

// Environment detection and error handling
const isExtensionEnvironment = () => {
  try {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  } catch (error) {
    console.error('Extension environment check failed:', error);
    return false;
  }
};

// Global error handler for unhandled errors
if (typeof globalThis !== 'undefined') {
  globalThis.addEventListener?.('error', (event) => {
    console.error('Global error in background script:', event.error);
  });
  
  globalThis.addEventListener?.('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in background script:', event.reason);
  });
}

// Ensure we're in the correct environment
if (!isExtensionEnvironment()) {
  console.error('Background script is not running in a valid extension environment');
}

// Utility function to check if URL is restricted (using centralized config)
const isRestrictedUrl = (url: string): boolean => {
  return isUrlRestricted(url);
};

// Utility function to get user-friendly error message (using centralized config)
const getRestrictedPageMessage = (url: string): string => {
  return getUrlRestrictionMessage(url);
};

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('CSS Style Extractor extension installed');
  console.log('Background script loaded at:', new Date().toISOString());
});

// Handle action click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension action clicked, opening side panel for tab:', tab.id);
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('Side panel opened successfully');
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  console.log('Message sender:', sender);
  
  switch (message.type) {
    case 'ANALYZE_STYLES':
      console.log('Analyzing styles...');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        
        if (tabs.length === 0) {
          console.error('No active tab found');
          sendResponse({ error: 'No active tab found' });
          return;
        }
        
        const activeTab = tabs[0];
        console.log('Active tab found for analysis:', activeTab.id, activeTab.url);
        
        // Check if the tab URL is accessible using centralized config
        if (!canExecuteOnUrl(activeTab.url || '')) {
          const errorMessage = getRestrictedPageMessage(activeTab.url || '');
          console.error('Cannot access restricted page:', activeTab.url, errorMessage);
          sendResponse({ 
            error: errorMessage,
            restricted: true,
            url: activeTab.url 
          });
          return;
        }
        
        // Send message to content script
        chrome.tabs.sendMessage(activeTab.id!, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error analyzing styles:', chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log('Style analysis completed:', response);
            sendResponse(response);
          }
        });
      });
      break;
      
    case 'ACTIVATE_PICKER':
      console.log('Activating picker...');
      // Query for the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        
        if (tabs.length === 0) {
          console.error('No active tab found');
          sendResponse({ error: 'No active tab found' });
          return;
        }
        
        const activeTab = tabs[0];
        console.log('Active tab found:', activeTab.id, activeTab.url);
        console.log('Tab details:', activeTab);
        
        // Check if the tab URL is accessible
        if (isRestrictedUrl(activeTab.url || '')) {
          const errorMessage = getRestrictedPageMessage(activeTab.url || '');
          console.log('Cannot access restricted page:', activeTab.url);
          sendResponse({ 
            success: false,
            error: errorMessage,
            restricted: true,
            url: activeTab.url 
          });
          return;
        }
        
        // Try to send message to content script first (it might already be injected)
        chrome.tabs.sendMessage(activeTab.id!, message, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Content script not found, injecting...', chrome.runtime.lastError.message);
            
            // Content script not found, inject it with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            
            const injectWithRetry = () => {
              chrome.scripting.executeScript({
                target: { tabId: activeTab.id! },
                files: ['assets/content.ts-loader.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error injecting content script:', chrome.runtime.lastError.message);
                  
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying injection (${retryCount}/${maxRetries})...`);
                    setTimeout(injectWithRetry, 500 * retryCount);
                    return;
                  }
                  
                  sendResponse({
                    success: false,
                    error: `Failed to inject content script after ${maxRetries} attempts: ${chrome.runtime.lastError.message}`
                  });
                  return;
                }

                console.log('Content script injected successfully');
                
                // Wait for content script to initialize with progressive delays
                const activateWithRetry = (attempt = 1) => {
                  const delay = Math.min(100 * attempt, 1000);
                  
                  setTimeout(() => {
                    console.log(`Sending ACTIVATE_PICKER message (attempt ${attempt})`);
                    chrome.tabs.sendMessage(activeTab.id!, { type: 'ACTIVATE_PICKER' }, (response) => {
                      if (chrome.runtime.lastError) {
                        console.error(`Error activating picker (attempt ${attempt}):`, chrome.runtime.lastError.message);
                        
                        if (attempt < maxRetries) {
                          activateWithRetry(attempt + 1);
                          return;
                        }
                        
                        sendResponse({
                          success: false,
                          error: `Could not establish connection after ${maxRetries} attempts. ${chrome.runtime.lastError.message}`
                        });
                      } else {
                        console.log('Picker activated successfully:', response);
                        sendResponse(response || { success: true });
                      }
                    });
                  }, delay);
                };
                
                activateWithRetry();
              });
            };
            
            injectWithRetry();
          } else {
            console.log('Picker activation response (existing script):', response);
            sendResponse(response);
          }
        });
      });
      break;
      
    case 'ELEMENT_SELECTED':
      console.log('Element selected, forwarding to popup:', message.data);
      // Forward element selection data to popup with connection check
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // This is expected when popup is closed - don't treat as error
            console.warn('Popup may be closed, ELEMENT_SELECTED message not delivered:', chrome.runtime.lastError.message);
          } else {
            console.log('ELEMENT_SELECTED forwarded successfully to popup');
          }
        });
      } catch (error) {
        console.warn('Failed to forward ELEMENT_SELECTED message (popup may be closed):', error);
      }
      sendResponse({ success: true });
      break;
      
    case 'PICKER_DEACTIVATED':
      console.log('Picker deactivated, forwarding to popup');
      // Forward picker deactivation to popup with connection check
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            // This is expected when popup is closed - don't treat as error
            console.warn('Popup may be closed, PICKER_DEACTIVATED message not delivered:', chrome.runtime.lastError.message);
          } else {
            console.log('PICKER_DEACTIVATED forwarded successfully to popup');
          }
        });
      } catch (error) {
        console.warn('Failed to forward PICKER_DEACTIVATED message (popup may be closed):', error);
      }
      sendResponse({ success: true });
      break;
      
    default:
       console.log('Unknown message type:', message.type);
       sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Content script is already injected via manifest.json
    console.log('Tab updated:', tab.url);
  }
});