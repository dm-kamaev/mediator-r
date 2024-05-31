module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', 'prettier', 'promise', 'no-unsafe-regex', 'new-with-error', 'unused-imports'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:promise/recommended',
  ],
  ignorePatterns: [
    '.eslintrc.js',
    'jest.config.js',
    'node_modules',
  ],
  rules: {
    'max-len': [
      2,
      {
        code: 200,
        tabWidth: 2,
        ignoreComments: true,
        ignoreUrls: true,
      },
    ],
    'linebreak-style': ['error', 'unix'],
    // quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'require-atomic-updates': 'off',
    'no-use-before-define': ['error', { functions: false, classes: false }],
    'no-multi-spaces': ['error'],
    'array-callback-return': ['error'],
    'block-scoped-var': ['error'],
    curly: ['error'],
    'no-throw-literal': ['error'],
    'guard-for-in': ['error'],
    'no-extend-native': ['error'],

    eqeqeq: ['error', 'always'],
    'no-extra-boolean-cast': ['off'],
    'no-console': ['off'],
    'no-useless-escape': ['off'],

    // === node js
    'handle-callback-err': ['error'],
    'global-require': ['error'],
    'callback-return': ['error'],
    'no-buffer-constructor': ['error'],
    'no-new-require': ['error'],
    // ===

    // === promise
    'promise/no-promise-in-callback': 'off',

    // === no-unsafe-regex
    'no-unsafe-regex/no-unsafe-regex': 2,

    // always 'new' for throw
    'new-with-error/new-with-error': 'error',

    'unused-imports/no-unused-imports': 'error',

    // typescript
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/no-this-alias': ['off'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '_',
        argsIgnorePattern: '_',
      },
    ],



  },
};