import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  globalIgnores([
    ".appdata/**",
    ".cache/**",
    ".localappdata/**",
    ".next/**",
    ".pnpm-cache/**",
    ".pnpm-state/**",
    ".pnpm-store/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "node_modules/**",
    "out/**",
    "playwright-report/**",
    "src/generated/prisma/**",
    "test-results/**",
    "tmp-next-bootstrap/**",
    "tmp-prisma-init/**",
  ]),
]);

export default eslintConfig;
