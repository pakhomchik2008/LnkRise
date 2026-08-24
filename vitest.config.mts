import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * "server-only" throws unconditionally outside Next's own bundler, which
 * every server module in src/lib imports. Aliasing it to an empty module is
 * the standard way to unit test Next.js server code with Vitest.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": new URL("./tests/empty-module.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
