import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 0.0.0.0 (컨테이너 외부 접근 허용)
    port: 5173,
    watch: {
      // Docker bind mount에서는 inotify가 동작 안 할 수 있어 polling 사용
      usePolling: true,
      interval: 300,
    },
  },
})
