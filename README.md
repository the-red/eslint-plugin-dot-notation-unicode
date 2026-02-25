# eslint-plugin-dot-notation-unicode

[![npm version](https://img.shields.io/npm/v/eslint-plugin-dot-notation-unicode.svg)](https://www.npmjs.com/package/eslint-plugin-dot-notation-unicode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

English | [日本語](/README.ja.md)

An ESLint plugin that extends the `dot-notation` rule with full Unicode identifier support. Fixes the issue where ESLint's built-in rule doesn't recognize Japanese, Chinese, Korean, and other Unicode characters as valid identifiers.

## The Problem

ESLint's built-in `dot-notation` rule uses this regex for identifier validation:

```js
const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/u;
```

This only matches ASCII characters, so valid JavaScript like `obj.日本語` is not recognized, and `obj["日本語"]` won't be flagged for conversion.

## The Solution

This plugin uses Unicode property escapes to correctly identify valid ECMAScript identifiers:

```js
const validIdentifier = /^[\p{ID_Start}_$][\p{ID_Continue}$\u200C\u200D]*$/u;
```

## Installation

```bash
npm install --save-dev eslint-plugin-dot-notation-unicode
# or
yarn add -D eslint-plugin-dot-notation-unicode
```

## Usage

### Flat Config (ESLint 9+)

```js
// eslint.config.js
import dotNotationUnicode from "eslint-plugin-dot-notation-unicode";

export default [
  {
    plugins: {
      "dot-notation-unicode": dotNotationUnicode,
    },
    rules: {
      "dot-notation": "off",
      "dot-notation-unicode/dot-notation": "error",
    },
  },
];
```

### Legacy Config

```json
{
  "plugins": ["dot-notation-unicode"],
  "rules": {
    "dot-notation": "off",
    "dot-notation-unicode/dot-notation": "error"
  }
}
```

## Examples

### Invalid (will be auto-fixed)

```js
obj["日本語"]    // → obj.日本語
obj["한국어"]    // → obj.한국어
obj["中文"]      // → obj.中文
obj["français"]  // → obj.français
obj["العربية"]   // → obj.العربية
obj["english"]   // → obj.english
```

### Valid (no error)

```js
obj.日本語
obj.한국어
obj.中文
obj.français
obj.العربية
obj.english
obj["content-type"]  // hyphen is not valid in identifiers
obj["123start"]      // cannot start with a number
obj[variable]        // dynamic access
```

## Options

This plugin supports the same options as ESLint's built-in `dot-notation` rule:

### `allowKeywords` (default: `true`)

When set to `false`, bracket notation is required for reserved words.

```js
// With { "allowKeywords": false }
obj["class"]  // OK
obj.class     // Error
```

### `allowPattern` (default: `""`)

A regex pattern for property names that are allowed to use bracket notation.

```js
// With { "allowPattern": "^[a-z]+_[a-z]+$" }
obj["snake_case"]  // OK (matches pattern)
obj["camelCase"]   // Error (doesn't match pattern)
```

## Why a Separate Plugin?

- ESLint's `dot-notation` rule is **frozen** and not accepting new features
- `@typescript-eslint/dot-notation` inherits the same limitation and requires type information (slower)
- No existing npm package solves this issue

## References

- [ESLint dot-notation rule](https://eslint.org/docs/latest/rules/dot-notation)
- [Unicode UAX #31 (Identifier Specification)](https://www.unicode.org/reports/tr31/)
- [ECMAScript IdentifierName](https://tc39.es/ecma262/#prod-IdentifierName)

## License

MIT License - see [LICENSE](LICENSE) for details.
