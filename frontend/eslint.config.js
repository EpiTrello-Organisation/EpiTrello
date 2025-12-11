import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import jsonc from "eslint-plugin-jsonc";
import yml from "eslint-plugin-yml";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

import jsoncParser from "jsonc-eslint-parser";
import yamlParser from "yaml-eslint-parser";

import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.{ts,tsx,js,jsx}"],

    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
    },

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.recommended,
      reactRefresh.configs.vite,
      "eslint-config-prettier",
    ],

    rules: {
      "unused-imports/no-unused-imports": "warn",
      "no-console": "off",
    },
  },

  {
    files: ["*.json", "*.jsonc", "*.json5"],

    languageOptions: {
      parser: jsoncParser,
    },

    plugins: {
      jsonc,
    },

    extends: ["plugin:jsonc/recommended-with-jsonc"],

    rules: {
      "jsonc/array-bracket-spacing": ["error", "never"],
      "jsonc/object-curly-spacing": ["error", "always"],
      "jsonc/key-spacing": [
        "error",
        { beforeColon: false, afterColon: true },
      ],
      "jsonc/quote-props": ["error", "as-needed"],
    },
  },

  {
    files: ["*.yml", "*.yaml"],

    languageOptions: {
      parser: yamlParser,
    },

    plugins: {
      yml,
    },

    extends: ["plugin:yml/standard"],

    rules: {
      "yml/indent": ["error", 2],
      "yml/no-empty-document": "error",
      "yml/quotes": ["error", { prefer: "single", avoidEscape: false }],
    },
  },
]);
