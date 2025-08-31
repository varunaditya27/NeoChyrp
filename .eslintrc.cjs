// ESLint configuration for NeoChyrp
// Philosophy:
// - Leverage Next.js recommended + TypeScript rules.
// - Prettier handles formatting; ESLint handles correctness & consistency.
// - Keep initial ruleset pragmatic for scaffold; tighten as implementation grows.
/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports',
    'tailwindcss'
  ],
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:tailwindcss/recommended',
    'prettier'
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json']
      }
    },
    tailwindcss: {
      callees: ['clsx', 'ctl']
    }
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    'prisma/migrations/**'
  ],
  rules: {
    // Style / cleanliness
    'prettier/prettier': 'off', // handled via CLI format script
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    // TypeScript tuning
    '@typescript-eslint/no-explicit-any': 'off', // allow during early scaffolding
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    // React / Next
    'react/jsx-key': 'off', // Next.js often handles keys in lists at map site; enable later
    // Tailwind
    'tailwindcss/classnames-order': 'warn'
  }
};
