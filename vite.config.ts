import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    // 为浏览器环境定义process对象，避免"process is not defined"错误
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env': '{}',
    'global': 'globalThis'
  },
  server: {
    hmr: {
      port: 5173
    }
  },
  build: {
    sourcemap: 'hidden',
    target: 'es2020',
    lib: {
      entry: {
        content: 'src/content/content.ts',
        background: 'src/background/background.ts'
      },
      formats: ['es']
    },
    rollupOptions: {
      external: [],
      output: {
        // 确保不生成内联脚本
        inlineDynamicImports: false,
        // 生成稳定的文件名，避免hash变化
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name.replace(/\.ts$/, '');
          return `assets/${name}.js`;
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        // 确保浏览器兼容性
        format: 'es',
        globals: {
          'process': 'undefined'
        }
      }
    }
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    crx({ 
      manifest,
      // 在生产模式下禁用开发服务器相关功能
      ...(mode === 'production' && {
        browser: 'chrome',
        contentScripts: {
          injectCss: false
        }
      })
    }),
    // 暂时移除 traeBadgePlugin 以解决 CSP 问题
    // traeBadgePlugin({
    //   variant: 'dark',
    //   position: 'bottom-right',
    //   prodOnly: true,
    //   clickable: true,
    //   clickUrl: 'https://www.trae.ai/solo?showJoin=1',
    //   autoTheme: true,
    //   autoThemeTarget: '#root'
    // }), 
    tsconfigPaths()
  ],
}))
