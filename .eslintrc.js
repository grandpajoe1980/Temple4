module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Many UI components intentionally use native <img> tags for simplicity
    // while backend image optimization is finalized. Disabling this rule keeps
    // linting focused on actionable issues until the migration to next/image
    // is complete.
    '@next/next/no-img-element': 'off',
  },
};
