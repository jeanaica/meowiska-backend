module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parser: "babel-eslint",
  extends: ["eslint:recommended", "google"],
  rules: {
    quotes: ["error", "double"],
    "quote-props": ["error", "as-needed"],
    "object-curly-spacing": [2, "always"],
    requireConfigFile: 0,
    "prefer-const": 0,
    "require-jsdoc": "off",
    indent: [2, 2],
    "max-len": 0,
    camelcase: 0,
  },
};
