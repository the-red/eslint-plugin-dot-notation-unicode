# eslint-plugin-dot-notation-unicode

[![npm version](https://img.shields.io/npm/v/eslint-plugin-dot-notation-unicode.svg)](https://www.npmjs.com/package/eslint-plugin-dot-notation-unicode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](/README.md) | 日本語

ESLint の `dot-notation` ルールを拡張し、Unicode 識別子に完全対応したプラグインです。ESLint 標準ルールが日本語・中国語・韓国語などの Unicode 文字を有効な識別子として認識しない問題を解決します。

## 問題点

ESLint 標準の `dot-notation` ルールは、識別子の判定に以下の正規表現を使用しています：

```js
const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/u;
```

これは ASCII 文字のみにマッチするため、`obj.日本語` のような有効な JavaScript が認識されず、`obj["日本語"]` がドット記法への変換対象になりません。

## 解決策

このプラグインは、Unicode プロパティエスケープを使用して、ECMAScript 仕様に準拠した識別子を正しく判定します：

```js
const validIdentifier = /^[\p{ID_Start}_$][\p{ID_Continue}$\u200C\u200D]*$/u;
```

## インストール

```bash
npm install --save-dev eslint-plugin-dot-notation-unicode
# または
yarn add -D eslint-plugin-dot-notation-unicode
```

## 使い方

### Flat Config（ESLint 9+）

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

## 例

### エラーになるコード（自動修正されます）

```js
obj["日本語"]    // → obj.日本語
obj["한국어"]    // → obj.한국어
obj["中文"]      // → obj.中文
obj["français"]  // → obj.français
obj["العربية"]   // → obj.العربية
obj["english"]   // → obj.english
```

### 正しいコード（エラーなし）

```js
obj.日本語
obj.한국어
obj.中文
obj.français
obj.العربية
obj.english
obj["content-type"]  // ハイフンは識別子に使えない
obj["123start"]      // 数字で始まる識別子は不可
obj[variable]        // 変数によるアクセス
```

## オプション

ESLint 標準の `dot-notation` ルールと同じオプションに加え、古いパーサーとの互換性のためのオプションをサポートしています。

### `allowKeywords`（デフォルト: `true`）

`false` にすると、ECMAScript 3 互換のスタイルに従い、予約語のプロパティにはブラケット記法が必要になります。

```js
// { "allowKeywords": false } の場合
obj["class"]  // OK
obj.class     // エラー
```

### `allowPattern`（デフォルト: `""`）

指定した正規表現にマッチするプロパティ名は、ブラケット記法を許可します。外部 API が snake_case を使用している場合に、自分のコードでは camelCase を維持しつつ対応するのに便利です。

```js
// { "allowPattern": "^[a-z]+_[a-z]+$" } の場合
obj["snake_case"]  // OK（パターンにマッチ）
obj["camelCase"]   // エラー（パターンにマッチしない）
```

### `legacyParserSupport`（デフォルト: `false`）

`true` にすると、古いパーサー（TypeScript 5.4 以前、Node.js 18.20 未満）との互換性を確保します。有効にすると、最新の Unicode 仕様では有効だが古いパーサーで認識されない一部の文字を含む識別子は、ドット記法に変換されません。

対象となる文字：
- `・`（U+30FB）カタカナ中黒
- ゼロ幅非接合子（U+200C）
- ゼロ幅接合子（U+200D）

```js
// { "legacyParserSupport": true } の場合
obj["あ・い"]  // OK（変換されない。「・」は古いパーサーで問題を起こす可能性あり）
obj["あい"]    // エラー（obj.あい に変換される）
```

> **注意**: このオプションは TypeScript 5.4 以前、または Node.js 18.20 未満を使用している場合にのみ必要です。これらの文字は [TypeScript 5.5 で修正](https://github.com/microsoft/TypeScript/pull/58521)され、Unicode 15.1 で対応されました。

## なぜ別プラグインが必要なのか

- ESLint 本体の `dot-notation` ルールは **Frozen（凍結）** 状態で、新機能は受け付けていない
- `@typescript-eslint/dot-notation` も同じ制限を継承しており、型情報が必要（実行が遅くなる）
- この問題を解決する npm パッケージは存在しない

## 参考情報

- [ESLint dot-notation ルール](https://eslint.org/docs/latest/rules/dot-notation)
- [Unicode UAX #31（識別子仕様）](https://www.unicode.org/reports/tr31/)
- [ECMAScript IdentifierName](https://tc39.es/ecma262/#prod-IdentifierName)

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。
