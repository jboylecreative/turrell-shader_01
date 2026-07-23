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
      // Shared core chunks (noise/fields/params) are #included by several
      // beverage modules; inline each only once per shader.
      removeDuplicatedImports: true,
      watch: true,
    }),
  ],
  server: {
    port: 5180,
    strictPort: false, // if 5180 is taken, Vite picks the next free port
    open: true,
  },
  build: {
    target: "es2022",
    outDir: "dist",
  },
});
