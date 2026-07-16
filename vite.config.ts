import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// GLSL files are imported as strings so the portable shader core stays
// copy-pasteable into TouchDesigner GLSL TOPs. `compress: false` keeps the
// source readable in the browser and in the bundle for debugging.
export default defineConfig({
  plugins: [
    glsl({
      include: ["**/*.glsl", "**/*.vert", "**/*.frag"],
      minify: false,
      watch: true,
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "es2022",
    outDir: "dist",
  },
});
