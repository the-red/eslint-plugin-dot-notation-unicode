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

This plugin supports the same options as ESLint's built-in `dot-notation` rule, plus an additional option for legacy parser compatibility.

### `allowKeywords` (default: `true`)

Set to `false` to follow ECMAScript version 3 compatible style, requiring bracket notation for reserved word properties.

```js
// With { "allowKeywords": false }
obj["class"]  // OK
obj.class     // Error
```

### `allowPattern` (default: `""`)

Allows bracket notation for property names that match the specified regular expression pattern. This is useful when working with external APIs that use snake_case while maintaining camelCase in your own code.

```js
// With { "allowPattern": "^[a-z]+_[a-z]+$" }
obj["snake_case"]  // OK (matches pattern)
obj["camelCase"]   // Error (doesn't match pattern)
```

### `legacyParserSupport` (default: `false`)

Set to `true` for compatibility with older parsers (TypeScript &lt; 5.5, Node.js < 18.20). When enabled, certain Unicode characters that are valid in the latest Unicode specification but not recognized by older parsers will not be converted to dot notation.

Affected characters:
- `・` (U+30FB) KATAKANA MIDDLE DOT
- Zero Width Non-Joiner (U+200C)
- Zero Width Joiner (U+200D)

```js
// With { "legacyParserSupport": true }
obj["あ・い"]  // OK (not converted, "・" may cause issues in older parsers)
obj["あい"]    // Error (will be converted to obj.あい)
```

> **Note**: This option is only needed if you're using TypeScript 5.4 or earlier, or Node.js versions before 18.20. These characters were [fixed in TypeScript 5.5](https://github.com/microsoft/TypeScript/pull/58521) and Unicode 15.1.

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
