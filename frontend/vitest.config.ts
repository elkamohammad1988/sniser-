import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure logic units — no DOM needed, so the fast node environment is fine.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
