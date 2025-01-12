import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "istanbul",
      include: ["src"],
      exclude: ["**/*.test.ts", "**/*.test-d.ts", "**/test-*.ts"],
    },
  },
});
