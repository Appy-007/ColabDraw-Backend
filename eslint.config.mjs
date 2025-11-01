// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      semi: 'off',
      '@typescript-eslint/semi': 'off',
      indent: 'off',
      '@typescript-eslint/indent': 'off',

      // 5. Disable rule about extra spaces (or lack thereof)
      'no-trailing-spaces': 'off',
      'key-spacing': 'off',

      // 6. If you want single-quotes (per your Prettier config) but don't want an error:
      quotes: 'off',
      '@typescript-eslint/quotes': 'off',

      // 7. Rule to ignore inconsistent line breaks/spacing around blocks
      'block-spacing': 'off',

      // ... your remaining rules ...
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
);
