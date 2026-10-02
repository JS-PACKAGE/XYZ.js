import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.vite/**',
      'coverage/**',
      'node_modules/**',
      'vendor/**',
      'docs/api/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
