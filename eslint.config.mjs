import tseslint from "typescript-eslint";

import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

import jsxA11y from "eslint-plugin-jsx-a11y";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unusedImports from "eslint-plugin-unused-imports";

import eslintReact from "@eslint-react/eslint-plugin";

export default defineConfig([
  // 忽略项分三类，理由各不相同：
  //  · dist / .electron —— 构建产物，非源码。
  //  · prototypes —— C+ 视觉稿 12 屏原型的冻结资产（真值来源）。它是对比基准，
  //    不是待维护代码：用 prettier 重排它会改动已入库的设计基线，从而污染
  //    `verify.py` 的参照物。其中的 assets/icons.js 因此长期挂着 33 条 prettier
  //    报错，修不得，只能不扫。
  //  · tools/design-fidelity/.venv —— 本地保真度工具链的 Python 虚拟环境（在
  //    .gitignore 里），装着 pip vendor 的 JS。CI 从仓库检出、永远看不到它。
  globalIgnores(["dist", ".electron", "prototypes", "tools/design-fidelity/.venv"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
    },
    rules: {
      // https://github.com/shadcn-ui/ui/issues/1534
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@eslint-react/hooks-extra/no-direct-set-state-in-use-effect": 0,
      "@eslint-react/no-array-index-key": 0,
      "@eslint-react/no-context-provider": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@eslint-react/dom/no-dangerously-set-innerhtml": 0,
      "react-hooks/rules-of-hooks": 0,
      // FIXME:MVP版本暂时不处理
      "jsx-a11y/no-static-element-interactions": 0,
      "jsx-a11y/click-events-have-key-events": 0,
      indent: 0,
    },
  },
  {
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          internalPattern: ["^~/.+", "^@/.+", "^@shared/.+"],
          sortSideEffects: false,
          groups: [
            "react",
            "typescript",
            "eslint",
            "eslint-plugin",
            "type-import",
            ["value-builtin", "value-external"],
            "type-internal",
            "value-internal",
            ["type-parent", "type-sibling", "type-index"],
            ["value-parent", "value-sibling", "value-index"],
            "ts-equals-import",
            "side-effect",
            "style",
            "side-effect-style",
            "unknown",
          ],
          customGroups: {
            value: {
              react: ["^react", "^react-dom"],
              typescript: ["^typescript"],
              eslint: ["^@eslint/.+", "^eslint/.+", "^globals"],
              "eslint-plugin": ["^eslint-plugin-.+"],
            },
          },
        },
      ],
    },
  },
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      // turn off other type-aware rules
      "other-plugin/typed-rule": "off",

      // turn off rules that don't apply to JS code
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  eslintPluginPrettierRecommended,
]);
