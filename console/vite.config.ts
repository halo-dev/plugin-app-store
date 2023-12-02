import { fileURLToPath, URL } from "url";

import { defineConfig, Plugin } from "vite";
import Vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import Markdown from "unplugin-vue-markdown/vite";
import { HaloUIPluginBundlerKit } from "@halo-dev/ui-plugin-bundler-kit";

export default defineConfig({
  plugins: [
    Vue({ include: [/\.vue$/, /\.md$/], script: { defineModel: true } }),
    Icons({ compiler: "vue3" }),
    Markdown({}),
    HaloUIPluginBundlerKit() as Plugin,
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
