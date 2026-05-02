import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["js/modules/**/*.js"],
      exclude: [
        "js/modules/app.js",
        "js/modules/config.js",
        "js/modules/map-view.js",
        "js/modules/poi-renderer.js",
        "js/modules/submap-view.js",
        "js/modules/ui-helpers.js",
        "js/modules/world-view.js",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
