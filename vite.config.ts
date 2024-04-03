import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    modulePreload: false,
    outDir: "./build",
    rollupOptions: {
      input: ["examples/counter/index.html"],
      output: {
        entryFileNames: (chunk) =>
          path
            .relative(__dirname, chunk.moduleIds.at(-1)!)
            .replace(/\.html$/, ".js"),
        manualChunks: {},
      },
    },
  },
});
