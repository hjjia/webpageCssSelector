# Chrome Web Store 隐私实践文案

## 1. Single Purpose Description（单一目的描述）

**CSS Master** is a developer tool designed specifically for extracting and analyzing CSS styles from web pages. The extension helps developers quickly identify colors, fonts, spacing, and other styling properties of webpage elements, and export them in various formats including Tailwind CSS classes.

**CSS Master** 是一个专门用于从网页中提取和分析CSS样式的开发者工具。该扩展帮助开发者快速识别网页元素的颜色、字体、间距和其他样式属性，并以多种格式（包括Tailwind CSS类）导出这些样式。

## 2. Permission Justifications（权限使用说明）

### 2.1 activeTab Permission

**English:**
The activeTab permission is required to access the currently active tab's DOM elements and computed styles. This allows CSS Master to analyze the styling properties of elements on the webpage that the user is currently viewing. The extension only accesses the active tab when the user explicitly opens the extension popup and interacts with the style extraction features.

**中文：**
activeTab权限用于访问当前活动标签页的DOM元素和计算样式。这使得CSS Master能够分析用户当前查看的网页元素的样式属性。扩展仅在用户明确打开扩展弹窗并与样式提取功能交互时才访问活动标签页。

### 2.2 Host Permission Use

**English:**
Host permissions are necessary to inject content scripts into web pages for real-time style analysis and element selection. The extension requires access to all websites ("<all_urls>") because users may want to extract styles from any webpage they visit. The extension only activates when users explicitly use the style extraction features and does not collect or transmit any personal data from the websites.

**中文：**
主机权限用于向网页注入内容脚本，以进行实时样式分析和元素选择。扩展需要访问所有网站（"<all_urls>"），因为用户可能希望从他们访问的任何网页中提取样式。扩展仅在用户明确使用样式提取功能时才激活，不会收集或传输网站的任何个人数据。

### 2.3 Remote Code Use

**English:**
CSS Master does not use any remote code. All functionality is contained within the extension package itself. No external scripts or code are loaded from remote servers during the extension's operation.

**中文：**
CSS Master不使用任何远程代码。所有功能都包含在扩展包本身中。在扩展运行期间不会从远程服务器加载任何外部脚本或代码。

### 2.4 Scripting Permission

**English:**
The scripting permission is essential for injecting content scripts that enable element selection and style extraction functionality. When users activate the element picker tool, the extension injects scripts to highlight elements on hover and capture their computed styles. This scripting capability is fundamental to the extension's core purpose of CSS analysis.

**中文：**
scripting权限对于注入内容脚本以启用元素选择和样式提取功能至关重要。当用户激活元素选择器工具时，扩展会注入脚本来高亮显示悬停的元素并捕获其计算样式。这种脚本功能是扩展CSS分析核心目的的基础。

### 2.5 sidePanel Permission

**English:**
The sidePanel permission allows CSS Master to provide a dedicated side panel interface for displaying extracted styles and analysis results. This provides a better user experience by offering more space for detailed style information, color palettes, and export options without interfering with the main webpage content.

**中文：**
sidePanel权限允许CSS Master提供专用的侧边栏界面来显示提取的样式和分析结果。这通过为详细的样式信息、调色板和导出选项提供更多空间来提供更好的用户体验，而不会干扰主要网页内容。

### 2.6 Storage Permission

**English:**
The storage permission is used to save user preferences, recently extracted color palettes, and export history locally within the browser. This enhances user experience by maintaining settings across browser sessions and allowing users to access their previous work. All data is stored locally and is not transmitted to external servers.

**中文：**
storage权限用于在浏览器内本地保存用户偏好设置、最近提取的调色板和导出历史。这通过在浏览器会话之间维护设置并允许用户访问其之前的工作来增强用户体验。所有数据都存储在本地，不会传输到外部服务器。

## 3. Data Usage Compliance Statement（数据使用合规声明）

**English:**
CSS Master is committed to user privacy and data protection. The extension:
- Only processes styling data from web pages when explicitly activated by the user
- Does not collect, store, or transmit any personal information or browsing data
- Stores user preferences and extracted styles locally in the browser only
- Does not use any analytics, tracking, or data collection services
- Does not communicate with external servers or third-party services
- Operates entirely offline after installation

All data processing is performed locally within the user's browser for the sole purpose of CSS style analysis and extraction. The extension fully complies with Google's Developer Program Policies regarding user data protection and privacy.

**中文：**
CSS Master致力于用户隐私和数据保护。该扩展：
- 仅在用户明确激活时处理网页的样式数据
- 不收集、存储或传输任何个人信息或浏览数据
- 仅在浏览器中本地存储用户偏好设置和提取的样式
- 不使用任何分析、跟踪或数据收集服务
- 不与外部服务器或第三方服务通信
- 安装后完全离线运行

所有数据处理都在用户浏览器内本地执行，仅用于CSS样式分析和提取。该扩展完全符合Google开发者计划政策关于用户数据保护和隐私的要求。