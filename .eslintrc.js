module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'n8n-nodes-base',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n8n-nodes-base/community',
    'prettier',
  ],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '*.js',
    '!.eslintrc.js',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'n8n-nodes-base/node-param-display-name-miscased': 'warn',
    'n8n-nodes-base/node-param-description-missing-final-period': 'off',
    'n8n-nodes-base/node-param-description-weak': 'off',
    'n8n-nodes-base/node-class-description-credentials-name-unsuffixed': 'off',
    'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
    'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
  },
};
