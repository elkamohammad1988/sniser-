// Flat ESLint config for the Sniser monorepo (backend = Node, frontend = React).
// Non-type-checked rules only: high signal, fast, no per-project program needed.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const unusedVars = [
  "error",
  {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_",
    ignoreRestSiblings: true,
  },
];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/build/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/*.config.mjs",
      "**/*.config.cjs",
      "frontend/scripts/**", // puppeteer screenshot tooling, run manually
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Turn tsc-overlapping rules into the underscore-aware variant used repo-wide.
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": unusedVars,
      // Allow the concise `cond ? sideEffect() : other()` statement idiom.
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
  },

  // Backend — Node runtime.
  {
    files: ["backend/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "error",
    },
  },

  // Frontend — browser + React.
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-console": "warn",
    },
  },
);
