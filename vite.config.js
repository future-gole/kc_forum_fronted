import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: { // <--- 添加或修改这个 server 对象
    host: true // <--- 设置 host 为 true
    // port: 5173 // 可以不写，默认 5173，或者指定你想要的端口
    
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    cssCodeSplit: true,
  }
})
