import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Type, Download, RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  analyzeGlobalStyles, 
  analyzeElementStyles, 
  generateTailwindConfig,
  type GlobalStyles,
  type ElementStyles,
  type ColorInfo
} from '../../utils/styleAnalyzer';
import { injectElementPicker } from '../../utils/elementPicker';
import { isUrlRestricted, getUrlRestrictionMessage, getUrlRestrictionCategory } from '../../utils/urlConfig';

type TabType = 'overview' | 'element' | 'export';

const Popup: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles | null>(null);
  const [elementStyles, setElementStyles] = useState<ElementStyles | null>(null);
  const [selectedElementData, setSelectedElementData] = useState<any>(null);
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [currentPageInfo, setCurrentPageInfo] = useState<{url: string, title: string, isRestrictedPage: boolean, isLocalDev?: boolean, isValidWebPage?: boolean, pageType?: string} | null>(null);

  useEffect(() => {
    getCurrentPageInfo();
    
    // Listen for messages from background script
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      console.log('Popup received message:', message);
      
      if (message.type === 'ELEMENT_SELECTED') {
        console.log('Element selected data received in popup:', message.data);
        setIsPickingElement(false);
        setSelectedElementData(message.data);
        // Process element data for display
        if (message.data && message.data.computedStyles) {
          const styles = message.data.computedStyles;
          const processedStyles = {
            tagName: message.data.tagName,
            className: message.data.className,
            id: message.data.id,
            textContent: message.data.textContent,
            dimensions: {
              width: styles.width || 'auto',
              height: styles.height || 'auto'
            },
            spacing: {
              margin: styles.margin || '0',
              padding: styles.padding || '0'
            },
            colors: {
              background: styles.backgroundColor || 'transparent',
              color: styles.color || '#000000'
            },
            typography: {
              fontFamily: styles.fontFamily || 'inherit',
              fontSize: styles.fontSize || '16px',
              fontWeight: styles.fontWeight || 'normal',
              lineHeight: styles.lineHeight || 'normal'
            }
          };
          setElementStyles(processedStyles);
        }
        // Switch to element tab to show results
        setActiveTab('element');
        sendResponse({ success: true });
      } else if (message.type === 'PICKER_DEACTIVATED') {
        console.log('Picker deactivated in popup');
        setIsPickingElement(false);
        sendResponse({ success: true });
      }
    };
    
    // Add message listener
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Cleanup function
    return () => {
      // Remove message listener
      chrome.runtime.onMessage.removeListener(messageListener);
      // Clean up any ongoing operations
      setIsAnalyzing(false);
      setIsPickingElement(false);
    };
  }, []);

  // Helper function to determine page type (using centralized config)
  const getPageType = (url: string): string => {
    if (!url) return 'unknown';
    const category = getUrlRestrictionCategory(url);
    if (category) {
      switch (category) {
        case 'browser-internal': return 'chrome-internal';
        case 'extension-store': return 'webstore';
        case 'local-file': return 'local-file';
        case 'data-url': return 'data-url';
        default: return category;
      }
    }
    if (url.startsWith('https://')) return 'secure-web';
    if (url.startsWith('http://')) return 'web';
    return 'unknown';
  };
  
  // Helper function to get user-friendly error message based on URL (using centralized config)
  const getRestrictedPageMessage = (url: string): string => {
    return getUrlRestrictionMessage(url);
  };

  const getCurrentPageInfo = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0].url) {
        const tab = tabs[0];
        const url = tab.url || '';
        
        // Use centralized URL restriction detection
        const isRestrictedPage = isUrlRestricted(url);
        
        // Additional check for local development and special cases
        const isLocalDev = url.startsWith('localhost') || url.startsWith('127.0.0.1') || url.includes('://localhost');
        const isValidWebPage = (url.startsWith('http://') || url.startsWith('https://')) && !isRestrictedPage;
        
        setCurrentPageInfo({
          url,
          title: tab.title || '',
          isRestrictedPage,
          isLocalDev,
          isValidWebPage,
          pageType: getPageType(url)
        });
        
        // Only auto-analyze if not on restricted page
        if (!isRestrictedPage) {
          handleAnalyzeGlobalStyles();
        }
      }
    } catch (error) {
      console.error('Error getting current page info:', error);
      // Fallback: assume restricted page to be safe
      setCurrentPageInfo({ url: 'unknown', title: '', isRestrictedPage: true });
    }
  };



  const handleAnalyzeGlobalStyles = async () => {
    // Check if current page is restricted
    if (currentPageInfo?.isRestrictedPage) {
      console.warn('Cannot analyze styles on restricted page:', currentPageInfo.url);
      return;
    }

    setIsAnalyzing(true);
    try {
      const styles = await analyzeGlobalStyles();
      setGlobalStyles(styles);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Handle specific error types
      if (error && typeof error === 'object' && 'restricted' in error) {
        // Update page info if we detect it's restricted
        setCurrentPageInfo(prev => prev ? { ...prev, isRestrictedPage: true } : null);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activateElementPicker = () => {
    if (currentPageInfo?.isRestrictedPage) {
      console.warn('Cannot activate picker on restricted page');
      return;
    }
    
    setIsPickingElement(true);
    setElementStyles(null);
    // Clear previous element data when starting new selection
    setSelectedElementData(null);
    
    // Send message to background script to activate picker
    console.log('Sending ACTIVATE_PICKER message to background...');
    chrome.runtime.sendMessage({ type: 'ACTIVATE_PICKER' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error activating picker:', chrome.runtime.lastError.message);
        setIsPickingElement(false);
        return;
      }
      
      console.log('Picker activation response:', response);
      
      if (response?.error) {
        console.error('Picker activation failed:', response.error);
        setIsPickingElement(false);
        return;
      }
      
      console.log('Element picker activated successfully');
    });
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getColorValue = (color: ColorInfo): string => {
    switch (colorFormat) {
      case 'rgb': return color.rgb;
      case 'hsl': return color.hsl;
      default: return color.hex;
    }
  };

  const handleGenerateTailwindConfig = () => {
    if (!globalStyles) return '';
    return generateTailwindConfig(globalStyles);
  };

  const downloadConfig = () => {
    const config = handleGenerateTailwindConfig();
    const blob = new Blob([config], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailwind.config.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: t('overview'), icon: Palette },
    { id: 'element', label: t('element'), icon: Type },
    { id: 'export', label: t('export'), icon: Download }
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('appName')}</h1>
              <p className="text-sm opacity-90 mt-1">{t('appDescription')}</p>
            </div>
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')}
              className="text-blue-100 hover:text-white text-sm px-2 py-1 rounded"
            >
              {i18n.language === 'en' ? '中文' : 'EN'}
            </button>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-all duration-200 relative',
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50/80'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
              )}
            >
              <Icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Restricted Page Warning */}
        {currentPageInfo?.isRestrictedPage && (
          <div className="mx-6 mt-6 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 mb-2">
                  {t('restrictedPage.title', 'Cannot Access This Page')}
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  {getRestrictedPageMessage(currentPageInfo.url || '')}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Current page type: {currentPageInfo.pageType || 'unknown'}
                </p>
                <div className="text-xs text-amber-600 bg-amber-100/50 rounded-lg px-3 py-2 font-mono break-all">
                  {t('restrictedPage.currentUrl', 'Current URL')}: {currentPageInfo.url}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {t('overview.pageInfo')}
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 min-w-[40px]">{t('overview.url')}:</span>
                  <span className="break-all">{window.location?.href || 'N/A'}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 min-w-[40px]">{t('overview.title')}:</span>
                  <span>{document?.title || 'N/A'}</span>
                </p>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                {t('overview.quickActions')}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleAnalyzeGlobalStyles}
                  disabled={isAnalyzing || currentPageInfo?.isRestrictedPage}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t('actions.analyzing')}
                    </>
                  ) : currentPageInfo?.isRestrictedPage ? (
                    t('actions.unavailable', 'Unavailable on this page')
                  ) : (
                    t('actions.analyze')
                  )}
                </button>
                <button
                  onClick={activateElementPicker}
                  disabled={currentPageInfo?.isRestrictedPage}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {currentPageInfo?.isRestrictedPage ? t('actions.unavailable', 'Unavailable on this page') : t('actions.pickElement')}
                </button>
              </div>
            </div>

            {/* Analysis Status */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('globalAnalysis')}</h2>
              <button
                onClick={handleAnalyzeGlobalStyles}
                disabled={isAnalyzing || currentPageInfo?.isRestrictedPage}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={cn(isAnalyzing && 'animate-spin')} />
                {isAnalyzing ? t('analyzing') : currentPageInfo?.isRestrictedPage ? t('unavailable') : t('refresh')}
              </button>
            </div>

            {globalStyles && (
              <div className="text-sm text-gray-600">
                {t('analysisTime', { time: Math.round(globalStyles.analysisTime) })}
              </div>
            )}

            {/* Colors Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {t('colorPalette')}
                </h3>
                <div className="flex gap-1">
                  {(['hex', 'rgb', 'hsl'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => setColorFormat(format)}
                      className={cn(
                        'px-2 py-1 text-xs rounded transition-all duration-200',
                        colorFormat === format
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              {globalStyles?.colors.length ? (
                <div className="grid grid-cols-3 gap-4">
                  {globalStyles.colors.map((color, index) => (
                    <div key={index} className="group cursor-pointer">
                      <div className="relative">
                        <div
                          className="w-full h-16 rounded-lg border border-gray-200/50 shadow-sm group-hover:shadow-md transition-all duration-200"
                          style={{ backgroundColor: color.hex }}
                          onClick={() => copyToClipboard(getColorValue(color), `color-${index}`)}
                        >
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center">
                            {copiedItem === `color-${index}` ? (
                              <Check size={16} className="text-white" />
                            ) : (
                              <Copy size={14} className="text-white opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-xs font-medium text-gray-700">{getColorValue(color)}</div>
                        <div className="text-xs text-gray-500">{color.usage || 1} uses</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  </div>
                  <p className="text-gray-500 text-sm">{isAnalyzing ? t('analyzing') : t('noColorsFound')}</p>
                </div>
              )}
            </div>

            {/* Fonts Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {t('fontFamilies')}
              </h3>
              {globalStyles?.fonts.length ? (
                <div className="space-y-3">
                  {globalStyles.fonts.map((font, index) => (
                    <div
                      key={index}
                      className="group bg-white/50 hover:bg-white/80 rounded-lg p-4 border border-gray-100/50 hover:border-gray-200/50 transition-all duration-200 cursor-pointer"
                      onClick={() => copyToClipboard(font.family, `font-${index}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1" style={{ fontFamily: font.family }}>
                            {font.family}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('frequency')}: {font.frequency}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {copiedItem === `font-${index}` ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={14} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600" style={{ fontFamily: font.family }}>
                        The quick brown fox jumps over the lazy dog
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="text-2xl text-gray-400">Aa</div>
                  </div>
                  <p className="text-gray-500 text-sm">{isAnalyzing ? t('analyzing') : t('noFontsFound')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'element' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50 shadow-sm">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {t('picker.title')}
              </h3>
              <p className="text-sm text-blue-700 mb-4">{t('picker.description')}</p>
              {isPickingElement && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 font-medium mb-1">💡 提示</p>
                  <p className="text-xs text-yellow-700">请保持此弹框打开，然后点击页面上的任意元素进行分析。选择完成后结果将自动显示在下方。</p>
                </div>
              )}
              <button
                onClick={activateElementPicker}
                disabled={isPickingElement || currentPageInfo?.isRestrictedPage}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <div className="w-4 h-4 border-2 border-white/50 border-dashed rounded"></div>
                {currentPageInfo?.isRestrictedPage ? t('actions.unavailable', 'Unavailable on this page') : isPickingElement ? t('clickToSelect') : t('pickElement')}
              </button>
            </div>

            {elementStyles && (
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700">✅ {t('picker.selectedElement')}</span>
                </h4>
                
                <div className="space-y-4">
                  <div className="bg-gray-50/80 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-2">Element Info</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className="font-medium min-w-[50px]">{t('picker.tag')}:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">{elementStyles.tagName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium min-w-[50px]">{t('picker.class')}:</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-mono">{elementStyles.className || 'None'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium min-w-[50px]">{t('picker.id')}:</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-mono">{elementStyles.id || 'None'}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Dimensions */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200/50 hover:bg-blue-100 transition-colors duration-200">
                    <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      📏 {t('dimensions')}
                    </h5>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div className="flex justify-between">
                        <span>Width:</span>
                        <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-xs">{elementStyles.dimensions.width}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Height:</span>
                        <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-xs">{elementStyles.dimensions.height}</span>
                      </div>
                    </div>
                  </div>

                  {/* Spacing */}
                  <div className="bg-gray-50/80 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-3">{t('spacing')}</h5>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-gray-600">{t('margin')}:</span>
                        <span className="font-mono text-gray-800">{elementStyles.spacing.margin}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-gray-600">{t('padding')}:</span>
                        <span className="font-mono text-gray-800">{elementStyles.spacing.padding}</span>
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200/50 hover:bg-purple-100 transition-colors duration-200">
                    <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                      🎨 {t('colors')}
                    </h5>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-purple-600">{t('background')}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border shadow-sm" style={{ backgroundColor: elementStyles.colors.background }}></div>
                          <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-xs">{elementStyles.colors.background}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-purple-600">{t('color')}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border shadow-sm" style={{ backgroundColor: elementStyles.colors.color }}></div>
                          <span className="font-mono bg-purple-100 px-2 py-0.5 rounded text-xs">{elementStyles.colors.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="bg-gray-50/80 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-3">{t('typography')}</h5>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-gray-600">{t('fontFamily')}:</span>
                        <span className="font-mono text-gray-800">{elementStyles.typography.fontFamily}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-gray-600">{t('fontSize')}:</span>
                        <span className="font-mono text-gray-800">{elementStyles.typography.fontSize}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-gray-600">{t('fontWeight')}:</span>
                        <span className="font-mono text-gray-800">{elementStyles.typography.fontWeight}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="font-medium text-gray-600">{t('lineHeight')}:</span>
                        <span className="font-mono text-gray-800">{elementStyles.typography.lineHeight}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="p-4 space-y-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                {t('exportConfig')}
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={downloadConfig}
                  disabled={!globalStyles}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  {t('downloadConfig')}
                </button>
                
                <button
                  onClick={() => copyToClipboard(handleGenerateTailwindConfig(), 'config')}
                  disabled={!globalStyles}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {copiedItem === 'config' ? <Check size={16} /> : <Copy size={16} />}
                  {t('copyCode')}
                </button>
              </div>
            </div>

            {globalStyles && (
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  {t('tailwindConfig')}
                </h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-gray-700">
                  <pre className="whitespace-pre-wrap">{handleGenerateTailwindConfig()}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;