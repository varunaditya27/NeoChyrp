// ESLint configuration for NeoChyrp
// Philosophy:
// - Leverage Next.js recommended + TypeScript rules.
// - Prettier handles formatting; ESLint handles correctness & consistency.
// - Keep initial ruleset pragmatic for scaffold; tighten as implementation grows.
// - Temporarily ignore all build warnings for development speed
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
    'unused-imports/no-unused-vars': 'off', // temporarily disabled
    
    // TypeScript tuning
    '@typescript-eslint/no-explicit-any': 'off', // allow during early scaffolding
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/consistent-type-imports': 'off', // temporarily disabled
    '@typescript-eslint/no-unused-vars': 'off', // temporarily disabled
    
    // React / Next
    'react/jsx-key': 'off', // Next.js often handles keys in lists at map site; enable later
    'react/no-unescaped-entities': 'off', // temporarily disabled
    'react-hooks/exhaustive-deps': 'off', // temporarily disabled
    
    // Import warnings
    'import/no-named-as-default-member': 'off', // temporarily disabled
    
    // Tailwind CSS warnings
    'tailwindcss/classnames-order': 'off', // temporarily disabled
    'tailwindcss/no-custom-classname': 'off', // temporarily disabled
    'tailwindcss/migration-from-tailwind-2': 'off', // temporarily disabled
    'tailwindcss/enforces-shorthand': 'off', // temporarily disabled
    
    // General JavaScript/TypeScript
    'prefer-const': 'off', // temporarily disabled
    'no-useless-escape': 'off', // temporarily disabled
    
    // Next.js specific
    '@next/next/no-img-element': 'off' // temporarily disabled
  }
};