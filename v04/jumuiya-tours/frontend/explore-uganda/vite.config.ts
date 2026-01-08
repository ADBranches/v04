// vite.config.ts
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import lineClamp from "@tailwindcss/line-clamp";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    // ✅ Tailwind plugin with subplugins passed in options
    tailwindcss({
      plugins: [lineClamp],
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
  },
});
