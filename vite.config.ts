import { defineConfig, type Plugin } from "vite";
import episodeRating from "./api/episode-rating.js";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // OneDrive блокирует файлы в этих папках → вотчер падает с EBUSY
      ignored: ["**/button/**", "**/design-references/**"],
    },
  },
  plugins: [{
    name: "episode-rating-api",
    configureServer(server) { server.middlewares.use("/api/episode-rating", episodeRating); },
    configurePreviewServer(server) { server.middlewares.use("/api/episode-rating", episodeRating); },
  } satisfies Plugin, react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
