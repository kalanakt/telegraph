import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@telegram-builder/shared": fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./apps/web", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
