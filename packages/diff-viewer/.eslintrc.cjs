module.exports = {
  env: { node: true }, // ← lets ESLint know globals like __dirname exist
  extends: ['../../eslint.config.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname, // ← critical so ../../tsconfig.base.json is found
  },
}
