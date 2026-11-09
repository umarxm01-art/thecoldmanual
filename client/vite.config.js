import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* The members app lives at /app/. The server serves the build and the API from one origin, so there are no CORS settings to manage. */
export default defineConfig({
  base: "/app/",
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:4000" }, fs: { allow: [".."] } },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false }
});
