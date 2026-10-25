import path from 'path'
import { defineConfig } from '@lark-apaas/coding-preset-vite-react'

// 站点基础配置，统一维护
const siteMeta = {
  appName: '股真人 - 轻量数据查询工具站',
  appDescription: '股真人，实时数据查询工具站',
  appAvatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ylcylz_fsph_ryhs/ljhwZthlaukjlkulzlp/feisuda/feisuda.svg'
}

export default defineConfig({
  base: '/',  // ✔ 显式覆盖预设默认的
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  plugins: [
    {
      name: 'platform-html-adapter',
      transformIndexHtml(html) {
        // 本地开发环境：一律替换，方便调试
        if (process.env.NODE_ENV === 'development') {
          return html
            .replaceAll('{{appName}}', siteMeta.appName)
            .replaceAll('{{appDescription}}', siteMeta.appDescription)
            .replaceAll('{{appAvatar}}', siteMeta.appAvatar)
        }

        // 生产打包：读取目标平台
        const targetPlatform = process.env.VITE_TARGET_PLATFORM || 'standalone'
        if (targetPlatform === 'lark') {
          // 飞书平台：原样返回，保留占位符交给飞书注入
          return html
        } else {
          // 其他独立部署平台：替换成真实站点信息
          return html
            .replaceAll('{{appName}}', siteMeta.appName)
            .replaceAll('{{appDescription}}', siteMeta.appDescription)
            .replaceAll('{{appAvatar}}', siteMeta.appAvatar)
        }
      }
    }
  ]
})
