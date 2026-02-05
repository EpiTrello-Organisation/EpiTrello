import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

import jsonc from "eslint-plugin-jsonc";
import yml from "eslint-plugin-yml";

import jsoncParser from "jsonc-eslint-parser";
import * as yamlParser from "yaml-eslint-parser";

import prettier from "eslint-config-prettier";

import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**", "coverage/**"]),

  // -----------------------
  // JS/TS/React
  // -----------------------
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended[0].rules,

      // react-hooks recommended (flat)
      ...reactHooks.configs.recommended.rules,

      // react-refresh vite config (flat)
      ...reactRefresh.configs.vite.rules,

      "unused-imports/no-unused-imports": "warn",
      "no-console": "off",

      // prettier should be last -> disable conflicting formatting rules
      ...prettier.rules,
    },
  },

  // -----------------------
  // JSON / JSONC / JSON5
  // -----------------------
  ...jsonc.configs["flat/recommended-with-jsonc"].map((c) => ({
    ...c,
    files: ["**/*.{json,jsonc,json5}"],
    languageOptions: {
      ...c.languageOptions,
      parser: jsoncParser,
    },
    rules: {
      ...c.rules,
      "jsonc/array-bracket-spacing": ["error", "never"],
      "jsonc/object-curly-spacing": ["error", "always"],
      "jsonc/key-spacing": ["error", { beforeColon: false, afterColon: true }],
      "jsonc/quote-props": ["error", "as-needed"],
    },
  })),

  // -----------------------
  // YAML
  // -----------------------
  ...yml.configs["flat/standard"].map((c) => ({
    ...c,
    files: ["**/*.{yml,yaml}"],
    languageOptions: {
      ...c.languageOptions,
      parser: yamlParser,
    },
    rules: {
      ...c.rules,
      "yml/indent": ["error", 2],
      "yml/no-empty-document": "error",
      "yml/quotes": ["error", { prefer: "single", avoidEscape: false }],
    },
  })),
]);
