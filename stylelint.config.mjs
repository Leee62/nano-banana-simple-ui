const config = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['theme', 'source', 'utility', 'variant', 'custom-variant', 'apply']
      }
    ],
    'selector-class-pattern': null,
    'import-notation': null,
    'custom-property-empty-line-before': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'property-no-vendor-prefix': null
  }
};

export default config;
