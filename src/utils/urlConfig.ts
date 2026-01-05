// URL configuration for extension restrictions and permissions

export interface UrlPattern {
  pattern: string;
  description: string;
  category: 'browser-internal' | 'extension-store' | 'local-file' | 'data-url' | 'other';
}

// Blacklisted URL patterns that the extension cannot access
export const BLACKLISTED_URLS: UrlPattern[] = [
  // Chrome internal pages
  { pattern: 'chrome://', description: 'Chrome internal pages', category: 'browser-internal' },
  { pattern: 'chrome-extension://', description: 'Chrome extension pages', category: 'browser-internal' },
  { pattern: 'edge://', description: 'Edge internal pages', category: 'browser-internal' },
  { pattern: 'about:', description: 'Browser about pages', category: 'browser-internal' },
  
  // Firefox internal pages
  { pattern: 'moz-extension://', description: 'Firefox extension pages', category: 'browser-internal' },
  
  // Extension stores
  { pattern: 'chrome.google.com/webstore', description: 'Chrome Web Store', category: 'extension-store' },
  { pattern: 'chromewebstore.google.com', description: 'Chrome Web Store (alternative)', category: 'extension-store' },
  { pattern: 'addons.mozilla.org', description: 'Firefox Add-ons Store', category: 'extension-store' },
  { pattern: 'microsoftedge.microsoft.com/addons', description: 'Edge Add-ons Store', category: 'extension-store' },
  
  // Local and data URLs
  { pattern: 'file://', description: 'Local file system', category: 'local-file' },
  { pattern: 'data:', description: 'Data URLs', category: 'data-url' },
  { pattern: 'blob:', description: 'Blob URLs', category: 'data-url' },
];

// Whitelisted URL patterns that the extension can access
export const WHITELISTED_URLS: UrlPattern[] = [
  { pattern: 'http://', description: 'HTTP websites', category: 'other' },
  { pattern: 'https://', description: 'HTTPS websites', category: 'other' },
];

/**
 * Check if a URL is restricted (blacklisted)
 * @param url - The URL to check
 * @returns true if the URL is restricted, false otherwise
 */
export const isUrlRestricted = (url: string): boolean => {
  if (!url) return true;
  
  // Check against blacklisted patterns
  return BLACKLISTED_URLS.some(({ pattern }) => url.includes(pattern) || url.startsWith(pattern));
};

/**
 * Check if a URL is explicitly whitelisted
 * @param url - The URL to check
 * @returns true if the URL is whitelisted, false otherwise
 */
export const isUrlWhitelisted = (url: string): boolean => {
  if (!url) return false;
  
  // Check against whitelisted patterns
  return WHITELISTED_URLS.some(({ pattern }) => url.startsWith(pattern));
};

/**
 * Get the category of restriction for a URL
 * @param url - The URL to categorize
 * @returns the category of restriction or null if not restricted
 */
export const getUrlRestrictionCategory = (url: string): string | null => {
  if (!url) return 'unknown';
  
  const restrictedPattern = BLACKLISTED_URLS.find(({ pattern }) => 
    url.includes(pattern) || url.startsWith(pattern)
  );
  
  return restrictedPattern ? restrictedPattern.category : null;
};

/**
 * Get a user-friendly error message for a restricted URL
 * @param url - The restricted URL
 * @returns a descriptive error message
 */
export const getUrlRestrictionMessage = (url: string): string => {
  const category = getUrlRestrictionCategory(url);
  
  switch (category) {
    case 'browser-internal':
      return 'Cannot access browser internal pages. Please navigate to a regular website to use this extension.';
    case 'extension-store':
      return 'Cannot access extension store pages. Please navigate to a regular website to use this extension.';
    case 'local-file':
      return 'Cannot access local files. Please navigate to a website to use this extension.';
    case 'data-url':
      return 'Cannot access data URLs or blob URLs. Please navigate to a regular website to use this extension.';
    default:
      return 'Cannot access this page. Please navigate to a regular website to use this extension.';
  }
};

/**
 * Check if the extension can safely execute on the given URL
 * @param url - The URL to check
 * @returns true if safe to execute, false otherwise
 */
export const canExecuteOnUrl = (url: string): boolean => {
  return !isUrlRestricted(url) && isUrlWhitelisted(url);
};