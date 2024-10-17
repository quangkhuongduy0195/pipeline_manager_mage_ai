import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Mở server cho tất cả các network interfaces
    port: 8008, // Hoặc bất kỳ port nào bạn muốn sử dụng
  },
})
