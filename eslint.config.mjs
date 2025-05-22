import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    plugins: {
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-duplicate-imports": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prettier/prettier": "error",
    },
  },
  {
    files: ["public/script.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        sessionStorage: "readonly", // Ajout de sessionStorage si nécessaire
      },
    },
  },
]);
