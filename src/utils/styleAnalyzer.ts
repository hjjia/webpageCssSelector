export interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  name?: string;
  usage?: number;
  frequency: number;
}

export interface FontInfo {
  family: string;
  frequency: number;
}

export interface GlobalStyles {
  colors: ColorInfo[];
  fonts: FontInfo[];
  analysisTime: number;
}

export interface ElementStyles {
  dimensions: {
    width: string;
    height: string;
  };
  spacing: {
    margin: string;
    padding: string;
  };
  colors: {
    background: string;
    color: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  tagName?: string;
  className?: string;
  id?: string;
}

// Color conversion utilities
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const hexToHsl = (hex: string): string => {
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

export const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Analyze global styles from the current page
export const analyzeGlobalStyles = async (): Promise<GlobalStyles> => {
  const startTime = performance.now();
  
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        resolve({ colors: [], fonts: [], analysisTime: 0 });
        return;
      }
      
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const colorMap = new Map<string, number>();
            const fontMap = new Map<string, number>();
            
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
          }
        },
        (results) => {
          if (!results || !results[0]?.result) {
            resolve({ colors: [], fonts: [], analysisTime: 0 });
            return;
          }
          
          const { colors, fonts } = results[0].result;
          
          // Process colors
          const processedColors: ColorInfo[] = colors
            .map(([color, frequency]: [string, number]) => {
              let hex = color;
              if (color.startsWith('rgb')) {
                hex = rgbToHex(color);
              }
              
              return {
                hex,
                rgb: hexToRgb(hex),
                hsl: hexToHsl(hex),
                frequency
              };
            })
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 20); // Limit to top 20 colors
          
          // Process fonts
          const processedFonts: FontInfo[] = fonts
            .map(([family, frequency]: [string, number]) => ({
              family: family.replace(/"/g, ''),
              frequency
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10); // Limit to top 10 fonts
          
          const analysisTime = performance.now() - startTime;
          
          resolve({
            colors: processedColors,
            fonts: processedFonts,
            analysisTime
          });
        }
      );
    });
  });
};

// Analyze specific element styles
export const analyzeElementStyles = (element: Element): ElementStyles => {
  const styles = window.getComputedStyle(element);
  
  return {
    dimensions: {
      width: styles.width,
      height: styles.height
    },
    spacing: {
      margin: styles.margin,
      padding: styles.padding
    },
    colors: {
      background: styles.backgroundColor,
      color: styles.color
    },
    typography: {
      fontFamily: styles.fontFamily.replace(/"/g, ''),
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight
    }
  };
};

// Generate Tailwind config from analyzed styles
export const generateTailwindConfig = (globalStyles: GlobalStyles): string => {
  const colors: Record<string, string> = {};
  const fontFamily: Record<string, string[]> = {};
  
  // Process colors
  globalStyles.colors.forEach((color, index) => {
    colors[`custom-${index + 1}`] = color.hex;
  });
  
  // Process fonts
  globalStyles.fonts.forEach((font, index) => {
    const fontName = font.family.split(',')[0].trim();
    fontFamily[`custom-${index + 1}`] = [fontName];
  });
  
  const config = {
    theme: {
      extend: {
        colors,
        fontFamily
      }
    }
  };
  
  return JSON.stringify(config, null, 2);
};