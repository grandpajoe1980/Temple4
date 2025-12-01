// Flat ESLint config with explicit TypeScript parser/plugin overrides and
// explicit plugin registration to avoid circular resolution when extending
// shareable configs. This config keeps linting functional for the repo while
// we finish migrating rules and ensures .ts/.tsx files are parsed by the
// TypeScript-aware parser.

module.exports = (function () {
  // Attempt to load plugin implementations; ignore failures so lint can still run
  // in environments where some plugins aren't installed yet.
  let reactPlugin = null;
  let reactHooksPlugin = null;
  let importPlugin = null;
  let jsxA11yPlugin = null;
  let nextPlugin = null;
  let typescriptEslintPlugin = null;
  let typescriptEslintParser = null;
  try { reactPlugin = require('eslint-plugin-react'); } catch (e) {}
  try { reactHooksPlugin = require('eslint-plugin-react-hooks'); } catch (e) {}
  try { importPlugin = require('eslint-plugin-import'); } catch (e) {}
  try { jsxA11yPlugin = require('eslint-plugin-jsx-a11y'); } catch (e) {}
  try { nextPlugin = require('@next/eslint-plugin-next'); } catch (e) {
    try { nextPlugin = require('eslint-plugin-next'); } catch (e) {}
  }
  try { typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin'); } catch (e) {}
  try { typescriptEslintParser = require('@typescript-eslint/parser'); } catch (e) {}

  const pluginMap = {};
  if (reactPlugin) pluginMap.react = reactPlugin;
  if (reactHooksPlugin) pluginMap['react-hooks'] = reactHooksPlugin;
  if (importPlugin) pluginMap.import = importPlugin;
  if (jsxA11yPlugin) pluginMap['jsx-a11y'] = jsxA11yPlugin;
  if (nextPlugin) {
    pluginMap['@next'] = nextPlugin;
    pluginMap['@next/next'] = nextPlugin;
  }
  if (typescriptEslintPlugin) pluginMap['@typescript-eslint'] = typescriptEslintPlugin;

  const configs = [];

  // Ignore build output and dependencies — these files are generated and
  // often contain directives or internal rules that should not be linted.
  configs.push({
    ignores: ['.next/**', 'node_modules/**'],
  });

  // TypeScript files: use the TypeScript ESLint parser and plugin.
  configs.push({
    files: ['**/*.{ts,tsx}'],
    languageOptions: typescriptEslintParser
      ? {
          parser: typescriptEslintParser,
          parserOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            ecmaFeatures: { jsx: true },
            // Avoid `project` here to prevent parsing files outside the tsconfig
            // during broad lint runs. Add `project` later if you need type-aware rules.
          },
        }
      : undefined,
    plugins: pluginMap,
    rules: {
      // TypeScript-specific rule adjustments can go here.
    },
  });

  // JavaScript/JSX files: default parser (espree) handles JS/JSX fine, but we
  // still register React/Next plugins so rules are available.
  configs.push({
    files: ['**/*.{js,jsx}'],
    plugins: pluginMap,
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@next/next/no-img-element': 'off',
    },
  });

  return configs;
})();
