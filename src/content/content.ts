// Content script for CSS Style Extractor

// Global type declarations
declare global {
  interface Window {
    __cssExtractorInjected?: boolean;
  }
}

// Prevent multiple injections
if (window.__cssExtractorInjected) {
  console.log('CSS Extractor content script already injected');
} else {
  window.__cssExtractorInjected = true;
  console.log('CSS Extractor content script initializing...');
}

// Global picker instance
let pickerInstance: ElementPicker | null = null;

// Element picker implementation
class ElementPicker {
  private isActive: boolean;
  private overlay: HTMLElement | null;
  private highlightBox: HTMLElement | null;
  private boundHandlers: {
    mouseover: (e: MouseEvent) => void;
    mouseout: (e: MouseEvent) => void;
    click: (e: MouseEvent) => void;
    keydown: (e: KeyboardEvent) => void;
  };
  
  // Callback functions
  public onElementSelected?: (element: Element) => void;
  public onPickerDeactivated?: () => void;

  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.highlightBox = null;
    
    // Bind event handlers
    this.boundHandlers = {
      mouseover: this.handleMouseOver.bind(this),
      mouseout: this.handleMouseOut.bind(this),
      click: this.handleClick.bind(this),
      keydown: this.handleKeyDown.bind(this)
    };
  }

  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.createOverlay();
    this.addEventListeners();
    
    // Change cursor to crosshair
    document.body.style.cursor = 'crosshair';
  }

  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeOverlay();
    this.removeEventListeners();
    
    // Restore cursor
    document.body.style.cursor = '';
    
    // Call callback if set
    if (this.onPickerDeactivated) {
      this.onPickerDeactivated();
    }
  }

  createOverlay() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
      z-index: 999999;
      pointer-events: none;
    `;
    
    // Create highlight box
    this.highlightBox = document.createElement('div');
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 1000000;
      transition: all 0.1s ease;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
    `;
    
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.highlightBox);
  }

  removeOverlay() {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    if (this.highlightBox) {
      document.body.removeChild(this.highlightBox);
      this.highlightBox = null;
    }
  }

  addEventListeners() {
    document.addEventListener('mouseover', this.boundHandlers.mouseover, true);
    document.addEventListener('mouseout', this.boundHandlers.mouseout, true);
    document.addEventListener('click', this.boundHandlers.click, true);
    document.addEventListener('keydown', this.boundHandlers.keydown, true);
  }

  removeEventListeners() {
    document.removeEventListener('mouseover', this.boundHandlers.mouseover, true);
    document.removeEventListener('mouseout', this.boundHandlers.mouseout, true);
    document.removeEventListener('click', this.boundHandlers.click, true);
    document.removeEventListener('keydown', this.boundHandlers.keydown, true);
  }

  handleMouseOver(e: MouseEvent) {
    if (!this.isActive || !this.highlightBox) return;
    
    const target = e.target as Element;
    if (!target || target === this.overlay || target === this.highlightBox) return;
    
    const rect = target.getBoundingClientRect();
    
    this.highlightBox.style.left = `${rect.left}px`;
    this.highlightBox.style.top = `${rect.top}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
    this.highlightBox.style.display = 'block';
  }

  handleMouseOut(e: MouseEvent) {
    if (!this.isActive || !this.highlightBox) return;
    
    const target = e.target as Element;
    if (!target || target === this.overlay || target === this.highlightBox) return;
    
    // Only hide if we're not moving to a child element
    const relatedTarget = e.relatedTarget as Element;
    if (!relatedTarget || !target.contains(relatedTarget)) {
      this.highlightBox.style.display = 'none';
    }
  }

  handleClick(e: MouseEvent) {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as Element;
    if (!target || target === this.overlay || target === this.highlightBox) return;
    
    // Get element styles
    const styles = window.getComputedStyle(target);
    const elementData = {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      styles: {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        padding: styles.padding,
        margin: styles.margin,
        border: styles.border,
        borderRadius: styles.borderRadius,
        width: styles.width,
        height: styles.height
      }
    };
    
    // Call callback if set
    if (this.onElementSelected) {
      this.onElementSelected(target);
    }
    
    this.deactivate();
  }

  handleKeyDown(e: KeyboardEvent) {
    if (!this.isActive) return;
    
    // Escape key to cancel
    if (e.key === 'Escape') {
      e.preventDefault();
      this.deactivate();
    }
  }
}

// Color conversion utilities
const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

// Analyze global styles
const analyzeGlobalStyles = () => {
  const colorMap = new Map();
  const fontMap = new Map();
  
  // Get all elements
  const elements = document.querySelectorAll('*');
  
  elements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    
    // Extract colors
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
      const count = colorMap.get(backgroundColor) || 0;
      colorMap.set(backgroundColor, count + 1);
    }
    
    if (color && color !== 'rgba(0, 0, 0, 0)') {
      const count = colorMap.get(color) || 0;
      colorMap.set(color, count + 1);
    }
    
    // Extract fonts
    const fontFamily = styles.fontFamily;
    if (fontFamily) {
      const count = fontMap.get(fontFamily) || 0;
      fontMap.set(fontFamily, count + 1);
    }
  });
  
  return {
    colors: Array.from(colorMap.entries()),
    fonts: Array.from(fontMap.entries())
  };
};

// Import URL configuration utilities
import { isUrlRestricted, getUrlRestrictionMessage } from '../utils/urlConfig';

// Utility function to check if current page is restricted
const isCurrentPageRestricted = (): boolean => {
  return isUrlRestricted(window.location.href);
};

// Get restriction message for current page
const getCurrentPageRestrictionMessage = (): string => {
  return getUrlRestrictionMessage(window.location.href);
};

// Listen for messages from popup via background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  console.log('Message sender:', sender);
  console.log('Content script URL:', window.location.href);
  console.log('Document ready state:', document.readyState);
  
  // Check if current page is restricted
  if (isCurrentPageRestricted()) {
    const errorMessage = getCurrentPageRestrictionMessage();
    console.warn('Content script: Cannot execute on restricted page:', window.location.href);
    sendResponse({ 
      success: false, 
      error: errorMessage,
      restricted: true,
      url: window.location.href
    });
    return true;
  }
  
  try {
    switch (message.type) {
      case 'ACTIVATE_PICKER':
        console.log('Activating element picker...');
        console.log('Current picker instance:', pickerInstance);
        if (pickerInstance) {
          console.log('Deactivating existing picker instance');
          pickerInstance.deactivate();
        }
        console.log('Creating new ElementPicker instance');
        pickerInstance = new ElementPicker();
        
        // Set up callbacks for element selection and deactivation
        pickerInstance.onElementSelected = (element) => {
          console.log('Element selected:', element);
          console.log('Element details:', {
            tagName: element.tagName,
            className: element.className,
            id: element.id
          });
          const computedStyles = window.getComputedStyle(element);
          const elementData = {
            tagName: element.tagName.toLowerCase(),
            className: element.className,
            id: element.id,
            textContent: element.textContent?.slice(0, 100) || '',
            computedStyles: {
              width: computedStyles.width,
              height: computedStyles.height,
              margin: computedStyles.margin,
              padding: computedStyles.padding,
              backgroundColor: computedStyles.backgroundColor,
              color: computedStyles.color,
              fontFamily: computedStyles.fontFamily,
              fontSize: computedStyles.fontSize,
              fontWeight: computedStyles.fontWeight,
              lineHeight: computedStyles.lineHeight,
              border: computedStyles.border,
              borderRadius: computedStyles.borderRadius,
              display: computedStyles.display,
              position: computedStyles.position
            }
          };
          
          console.log('Sending ELEMENT_SELECTED message to background');
          try {
            chrome.runtime.sendMessage({
              type: 'ELEMENT_SELECTED',
              data: elementData
            }, (response) => {
              if (chrome.runtime.lastError) {
                // This is expected when popup is closed - don't treat as error
                console.warn('ELEMENT_SELECTED message sent, popup may be closed:', chrome.runtime.lastError.message);
              } else {
                console.log('ELEMENT_SELECTED sent successfully:', response);
              }
            });
          } catch (error) {
            console.warn('Failed to send ELEMENT_SELECTED message:', error);
          }
        };
        
        pickerInstance.onPickerDeactivated = () => {
          console.log('Picker deactivated');
          try {
            chrome.runtime.sendMessage({ type: 'PICKER_DEACTIVATED' }, (response) => {
              if (chrome.runtime.lastError) {
                // This is expected when popup is closed - don't treat as error
                console.warn('PICKER_DEACTIVATED message sent, popup may be closed:', chrome.runtime.lastError.message);
              } else {
                console.log('PICKER_DEACTIVATED sent successfully:', response);
              }
            });
          } catch (error) {
            console.warn('Failed to send PICKER_DEACTIVATED message:', error);
          }
        };
        
        console.log('Activating picker instance...');
        pickerInstance.activate();
        console.log('Picker activation completed');
        sendResponse({ success: true, message: 'Picker activated successfully' });
        break;
        
      case 'ANALYZE_STYLES':
        console.log('Analyzing global styles...');
        try {
          const result = analyzeGlobalStyles();
          sendResponse({ success: true, data: result });
        } catch (error) {
          console.error('Error analyzing styles:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: 'Internal error processing message' });
  }
  
  return true; // Keep message channel open for async response
});

// Mark as injected
window.__cssExtractorInjected = true;
console.log('CSS Extractor content script loaded');

// Export onExecute function for the loader
export const onExecute = (context?: { perf?: { injectTime: number; loadTime: number } }) => {
  console.log('Content script onExecute called', context);
  // The main content script logic is already executed above
  // This function is called by the loader after the script is loaded
};