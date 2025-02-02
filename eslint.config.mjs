import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("typescript-eslint").ConfigArray} */
const config = tseslint.config(
  {
    ignores: ["coverage", "**/dist"],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    languageOptions: {
      globals: {
        Buffer: "readonly",
        console: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    files: ["examples/**/*.ts", "src/**/*.test.ts", "tests/**/*ts"],
    rules: {
      // The examples and tests often have quick DOM manipulation code,
      // where it is very convenient to be able to "!" past values that
      // the type system thinks might be undefined.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);

export default config;
