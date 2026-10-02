import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Sends /api requests to the Python backend, so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5000" } },
});
