import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("typescript-eslint").ConfigArray} */
const config = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    ignores: ["coverage", "dist"],
  },
);

export default config;
