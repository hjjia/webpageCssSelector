import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // App Title
      appName: 'CSS Master',
      appDescription: 'Style Extractor',
      
      // Navigation
      overview: 'Overview',
      element: 'Element',
      export: 'Export',
      settings: 'Settings',
      
      // Tabs
      tabs: {
        overview: 'Overview',
        fonts: 'Fonts',
        picker: 'Element Picker',
        export: 'Export'
      },
      
      // Overview Tab
      globalAnalysis: 'Global Analysis',
      colorPalette: 'Color Palette',
      fontFamilies: 'Font Families',
      analyzing: 'Analyzing...',
      analysisComplete: 'Analysis Complete',
      analysisTime: 'Analysis Time: {{time}}ms',
      
      // Colors
      colorsFound: 'Found {{count}} colors',
      copyColor: 'Copy Color',
      colorCopied: 'Color copied to clipboard',
      hex: 'HEX',
      rgb: 'RGB',
      hsl: 'HSL',
      
      // Fonts
      fonts: 'Fonts',
      fontsFound: '{{count}} fonts found',
      copyFont: 'Copy Font',
      fontCopied: 'Font copied to clipboard',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      fontWeight: 'Font Weight',
      
      // Element Picker
      pickElement: 'Pick Element',
      elementPicker: 'Element Picker',
      clickToSelect: 'Click on any element to analyze its styles',
      elementSelected: 'Element Selected',
      elementStyles: 'Element Styles',
      
      // Element Properties
      dimensions: 'Dimensions',
      spacing: 'Spacing',
      typography: 'Typography',
      colors: 'Colors',
      other: 'Other',
      width: 'Width',
      height: 'Height',
      margin: 'Margin',
      padding: 'Padding',
      background: 'Background',
      color: 'Color',
      border: 'Border',
      borderRadius: 'Border Radius',
      boxShadow: 'Box Shadow',
      lineHeight: 'Line Height',
      
      // Code Output
      originalCSS: 'Original CSS',
      tailwindCSS: 'Tailwind CSS',
      copyCode: 'Copy Code',
      codeCopied: 'Code copied to clipboard',
      
      // Export
      exportConfig: 'Export Config',
      tailwindConfig: 'Tailwind Config',
      exportColors: 'Export Colors',
      exportFonts: 'Export Fonts',
      exportAll: 'Export All',
      downloadConfig: 'Download Config',
      configGenerated: 'Config generated successfully',
      
      // Actions
      copy: 'Copy',
      download: 'Download',
      cancel: 'Cancel',
      close: 'Close',
      refresh: 'Refresh',
      
      // Messages
      noColorsFound: 'No colors found on this page',
      noFontsFound: 'No fonts found on this page',
      analysisError: 'Error during analysis',
      copySuccess: 'Copied to clipboard',
      copyError: 'Failed to copy',
      
      // Premium Features
      premiumFeature: 'Premium Feature',
      upgradeRequired: 'Upgrade to access this feature',
      upgrade: 'Upgrade',
      
      // Settings
      language: 'Language',
      theme: 'Theme',
      autoAnalysis: 'Auto Analysis',
      exportFormat: 'Export Format',
      
      // Footer
      version: 'Version {{version}}',
      madeWith: 'Made with ❤️ by CSS Master Team'
    }
  },
  zh: {
    translation: {
      // App Title
      appName: 'CSS Master',
      appDescription: '样式提取器',
      
      // Navigation
      overview: '概览',
      element: '元素',
      export: '导出',
      settings: '设置',
      
      // Tabs
      tabs: {
        overview: '概览',
        fonts: '字体',
        picker: '元素拾取器',
        export: '导出'
      },
      
      // Overview Tab
      globalAnalysis: '全局分析',
      colorPalette: '色彩调色板',
      fontFamilies: '字体家族',
      analyzing: '分析中...',
      analysisComplete: '分析完成',
      analysisTime: '分析耗时：{{time}}毫秒',
      
      // Colors
      colorsFound: '找到 {{count}} 种颜色',
      copyColor: '复制颜色',
      colorCopied: '颜色已复制到剪贴板',
      hex: 'HEX',
      rgb: 'RGB',
      hsl: 'HSL',
      
      // Fonts
      fonts: '字体',
      fontsFound: '找到 {{count}} 种字体',
      copyFont: '复制字体',
      fontCopied: '字体已复制到剪贴板',
      fontFamily: '字体家族',
      fontSize: '字体大小',
      fontWeight: '字体粗细',
      
      // Element Picker
      pickElement: '选择元素',
      elementPicker: '元素选择器',
      clickToSelect: '点击任意元素来分析其样式',
      elementSelected: '元素已选择',
      elementStyles: '元素样式',
      
      // Element Properties
      dimensions: '尺寸',
      spacing: '间距',
      typography: '字体排版',
      colors: '颜色',
      other: '其他',
      width: '宽度',
      height: '高度',
      margin: '外边距',
      padding: '内边距',
      background: '背景',
      color: '颜色',
      border: '边框',
      borderRadius: '圆角',
      boxShadow: '阴影',
      lineHeight: '行高',
      
      // Code Output
      originalCSS: '原始 CSS',
      tailwindCSS: 'Tailwind CSS',
      copyCode: '复制代码',
      codeCopied: '代码已复制到剪贴板',
      
      // Export
      exportConfig: '导出配置',
      tailwindConfig: 'Tailwind 配置',
      exportColors: '导出颜色',
      exportFonts: '导出字体',
      exportAll: '导出全部',
      downloadConfig: '下载配置',
      configGenerated: '配置生成成功',
      
      // Actions
      copy: '复制',
      download: '下载',
      cancel: '取消',
      close: '关闭',
      refresh: '刷新',
      
      // Messages
      noColorsFound: '此页面未找到颜色',
      noFontsFound: '此页面未找到字体',
      analysisError: '分析过程中出错',
      copySuccess: '已复制到剪贴板',
      copyError: '复制失败',
      
      // Premium Features
      premiumFeature: '高级功能',
      upgradeRequired: '升级以使用此功能',
      upgrade: '升级',
      
      // Settings
      language: '语言',
      theme: '主题',
      autoAnalysis: '自动分析',
      exportFormat: '导出格式',
      
      // Footer
      version: '版本 {{version}}',
      madeWith: '由 CSS Master 团队用 ❤️ 制作'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // react already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;