import rollupPluginSwc from "@rollup/plugin-swc";
import rollupPluginNodeResolve from "@rollup/plugin-node-resolve";
import * as Rollup from "rollup";

export default Rollup.defineConfig({
  plugins: [
    rollupPluginNodeResolve({ extensions: [".ts"] }),
    rollupPluginSwc(),
  ],
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
