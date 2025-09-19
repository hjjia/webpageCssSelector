import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { ElementStyles } from '../../utils/styleAnalyzer';

interface ElementStylesDisplayProps {
  elementStyles: ElementStyles;
  copyToClipboard: (text: string, key: string) => void;
  copiedItem: string | null;
  t: (key: string) => string;
}

const ElementStylesDisplay: React.FC<ElementStylesDisplayProps> = ({
  elementStyles,
  copyToClipboard,
  copiedItem,
  t
}) => {
  const [showFullCSS, setShowFullCSS] = useState(false);
  const [copiedFullCSS, setCopiedFullCSS] = useState(false);

  // 生成完整的CSS样式
  const generateFullCSS = (): string => {
    const selector = elementStyles.className 
      ? `.${elementStyles.className.split(' ').join('.')}`
      : elementStyles.tagName?.toLowerCase() || 'element';
    
    return `${selector} {
  /* Dimensions */
  width: ${elementStyles.dimensions.width};
  height: ${elementStyles.dimensions.height};
  
  /* Spacing */
  margin: ${elementStyles.spacing.margin};
  padding: ${elementStyles.spacing.padding};
  
  /* Colors */
  background-color: ${elementStyles.colors.background};
  color: ${elementStyles.colors.color};
  
  /* Typography */
  font-family: ${elementStyles.typography.fontFamily};
  font-size: ${elementStyles.typography.fontSize};
  font-weight: ${elementStyles.typography.fontWeight};
  line-height: ${elementStyles.typography.lineHeight};
}`;
  };

  // 复制完整CSS
  const handleCopyFullCSS = () => {
    const fullCSS = generateFullCSS();
    copyToClipboard(fullCSS, 'fullCSS');
    setCopiedFullCSS(true);
    setTimeout(() => setCopiedFullCSS(false), 2000);
  };

  // 颜色值转换函数
  const getColorValue = (color: string, format: 'hex' | 'rgb' | 'hsl'): string => {
    if (format === 'hex') {
      if (color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        }
      }
      return color;
    }
    if (format === 'rgb') {
      if (color.startsWith('#')) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        if (result) {
          const r = parseInt(result[1], 16);
          const g = parseInt(result[2], 16);
          const b = parseInt(result[3], 16);
          return `rgb(${r}, ${g}, ${b})`;
        }
      }
      return color;
    }
    if (format === 'hsl') {
      // 简化的HSL转换，实际项目中可能需要更完整的实现
      return color;
    }
    return color;
  };

  return (
    <div className="space-y-4">
      {/* 元素信息 */}
      <div className="bg-gray-50 p-2.5 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-1.5">{t('elementInfo')}</h4>
        <div className="space-y-1.5 text-sm">
          {elementStyles.tagName && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('tag')}:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border text-gray-800">
                {elementStyles.tagName}
              </span>
            </div>
          )}
          {elementStyles.className && (
            <div className="flex flex-col gap-1">
              <span className="text-gray-600">{t('classes')}:</span>
              <div className="font-mono bg-white px-2 py-1 rounded border text-gray-800 text-xs break-all">
                {elementStyles.className}
              </div>
            </div>
          )}
          {elementStyles.id && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('id')}:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border text-gray-800">
                #{elementStyles.id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 完整CSS展示和复制 */}
      <div className="bg-blue-50 p-2.5 rounded-lg">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <Code className="w-4 h-4" />
            {t('completeCSS')}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFullCSS(!showFullCSS)}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              {showFullCSS ? t('hide') : t('show')}
            </button>
            <button
              onClick={handleCopyFullCSS}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {copiedFullCSS ? (
                <><Check className="w-3 h-3" /> {t('copied')}!</>
              ) : (
                <><Copy className="w-3 h-3" /> {t('copyCSS')}</>
              )}
            </button>
          </div>
        </div>
        
        {showFullCSS && (
          <pre className="bg-white p-2.5 rounded border text-xs font-mono overflow-x-auto text-gray-800 whitespace-pre-wrap">
            {generateFullCSS()}
          </pre>
        )}
      </div>

      {/* 样式属性详细展示 */}
      <div className="space-y-4">
        {/* Dimensions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {t('dimensions')}
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('width')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.dimensions.width, 'width')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.dimensions.width}</span>
                {copiedItem === 'width' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('height')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.dimensions.height, 'height')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.dimensions.height}</span>
                {copiedItem === 'height' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {t('spacing')}
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('margin')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.spacing.margin, 'margin')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.spacing.margin}</span>
                {copiedItem === 'margin' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('padding')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.spacing.padding, 'padding')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.spacing.padding}</span>
                {copiedItem === 'padding' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            {t('colors')}
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('background')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.colors.background, 'background')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <div 
                  className="w-4 h-4 rounded border border-gray-300 shadow-sm" 
                  style={{ backgroundColor: elementStyles.colors.background }}
                ></div>
                <span className="font-mono text-gray-800">{elementStyles.colors.background}</span>
                {copiedItem === 'background' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('textColor')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.colors.color, 'color')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <div 
                  className="w-4 h-4 rounded border border-gray-300 shadow-sm" 
                  style={{ backgroundColor: elementStyles.colors.color }}
                ></div>
                <span className="font-mono text-gray-800">{elementStyles.colors.color}</span>
                {copiedItem === 'color' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/50 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            {t('typography')}
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('fontFamily')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.typography.fontFamily, 'fontFamily')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.typography.fontFamily}</span>
                {copiedItem === 'fontFamily' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('fontSize')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.typography.fontSize, 'fontSize')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.typography.fontSize}</span>
                {copiedItem === 'fontSize' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('fontWeight')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.typography.fontWeight, 'fontWeight')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.typography.fontWeight}</span>
                {copiedItem === 'fontWeight' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-sm font-medium text-gray-700">{t('lineHeight')}</span>
              <button
                onClick={() => copyToClipboard(elementStyles.typography.lineHeight, 'lineHeight')}
                className="group flex items-center gap-2 px-2.5 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200/50"
              >
                <span className="font-mono text-gray-800">{elementStyles.typography.lineHeight}</span>
                {copiedItem === 'lineHeight' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementStylesDisplay;