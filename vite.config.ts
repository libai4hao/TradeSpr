import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const siteMeta = {
  appName: '股真人 - 轻量数据查询工具站',
  appDescription: '股真人，实时数据查询工具站',
  appAvatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ylcylz_fsph_ryhs/ljhwZthlaukjlkulzlp/feisuda/feisuda.svg'
}

export default defineConfig({
  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
    },
  },

  plugins: [
    react(),
    tailwindcss(),

    // 保留你原来的 HTML 站点信息注入
    {
      name: 'platform-html-adapter',
      transformIndexHtml(html) {
        const targetPlatform = process.env.VITE_TARGET_PLATFORM || 'standalone'
        if (targetPlatform === 'lark') return html
        return html
          .replaceAll('{{appName}}', siteMeta.appName)
          .replaceAll('{{appDescription}}', siteMeta.appDescription)
          .replaceAll('{{appAvatar}}', siteMeta.appAvatar)
      }
    }
  ],

  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // 加载优化--按 package.json 里的重型依赖分包
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom|react-router-dom|@tanstack|react-error-boundary)/,
              priority: 10,
            },
            {
              name: 'vendor-charts',
              test: /node_modules\/(echarts|echarts-for-react|recharts)/,
              priority: 9,
            },
            {
              name: 'vendor-radix',
              test: /node_modules\/@radix-ui/,
              priority: 8,
            },
            {
              name: 'vendor-motion',
              test: /node_modules\/(framer-motion|gsap|@gsap)/,
              priority: 7,
            },
          ],
        },
      },
    }
  }
})