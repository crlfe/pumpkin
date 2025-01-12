import * as Rollup from "rollup";
import swc from "@rollup/plugin-swc";

export default Rollup.defineConfig({
  plugins: [swc()],
  input: "src/index.ts",
  output: [
    {
      dir: "dist",
      format: "cjs",
      sourcemap: true,
    },
    {
      dir: "dist",
      format: "esm",
      sourcemap: true,
      entryFileNames: "[name].mjs",
      chunkFileNames: "[name].mjs",
    },
  ],
});
