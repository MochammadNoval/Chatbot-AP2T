import { defineConfig, loadEnv } from "vite";
import { resolve } from 'path'
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [vue(), tailwindcss()],
    server: {
      host: "0.0.0.0", // ⬅️ Wajib agar dapat diakses dari luar container
      port: 5170, // ⬅️ Opsional, default-nya memang 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    resolve:{
      alias:{
        '@': resolve(__dirname, 'src')
      }
    }
  };
});
