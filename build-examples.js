import path from "node:path";
import fs from "node:fs";
import { build } from "vite";

// Build each example separately to avoid sharing chunks.
for (const name of await fs.promises.readdir("examples")) {
  console.log("Building", path.join("examples", name));
  await build({
    base: "./",
    root: path.resolve("examples", name),
    build: {
      emptyOutDir: true,
      modulePreload: false,
      rollupOptions: {
        output: {
          assetFileNames: (chunk) => chunk.name,
          entryFileNames: (chunk) =>
            path.basename(chunk.moduleIds.at(-2)).replace(/\.[^\.]+/, ".js"),

          manualChunks: {},
        },
      },
    },
    esbuild: {
      mangleProps: /_$/,
    },
  });
  console.log();
}
