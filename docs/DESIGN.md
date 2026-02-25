# eslint-plugin-dot-notation-unicode 設計書

## 1. 概要

ESLint標準の `dot-notation` ルールがUnicode識別子（日本語・中国語・韓国語等）に対応していない問題を解決するESLintプラグイン。

ブラケット記法 `obj['日本語キー']` をドット記法 `obj.日本語キー` に矯正する。

## 2. 背景・課題

### 2.1 ESLint標準 `dot-notation` ルールの問題

ESLint本体の `dot-notation` ルールは、識別子の判定に以下の正規表現を使用している：

```js
const validIdentifier = /^[a-zA-Z_$][\w$]*$/u;
```

ASCII範囲のみがハードコードされており、JavaScript仕様上有効な日本語等のUnicode識別子を検出できない。

### 2.2 `@typescript-eslint/dot-notation` の状況

`@typescript-eslint/dot-notation` は ESLint 本家の `dot-notation` を**拡張**したルール。単純なラッパーではなく、以下の機能を追加している：

- **型情報の活用**: TypeScript の型情報を使って判定を行う
- **追加オプション**:
  - `allowPrivateClassPropertyAccess` - private プロパティへのブラケットアクセスを許可
  - `allowProtectedClassPropertyAccess` - protected プロパティへのブラケットアクセスを許可
  - `allowIndexSignaturePropertyAccess` - インデックスシグネチャのプロパティへのブラケットアクセスを許可

しかし、**識別子判定は本家ESLintのロジックを継承しているため、Unicode識別子の問題は同様に存在する**。

参考: https://typescript-eslint.io/rules/dot-notation/

#### 将来の拡張: TypeScript版プラグイン

本プラグインの TypeScript 対応版（`@typescript-eslint/dot-notation` の Unicode 対応版）を作成する場合は、以下のアプローチが考えられる：

1. `@typescript-eslint/dot-notation` のソースコードをフォークし、識別子判定を `\p{ID_Start}` / `\p{ID_Continue}` ベースに差し替え
2. 型情報を活用した追加オプション（`allowPrivateClassPropertyAccess` 等）はそのまま維持
3. パッケージ名は `eslint-plugin-dot-notation-unicode-ts` または `@the-red/eslint-plugin-dot-notation-unicode-ts` などを検討

### 2.3 ルール凍結（Frozen）

ESLint本体の `dot-notation` ルールは **Frozen（凍結）** 状態であり、新機能リクエストは受け付けていない。バグ報告として通る可能性はゼロではないが、本体での修正は期待しにくい。

### 2.4 既存のnpmパッケージ

調査の結果、この問題を解決するnpmパッケージは2025年時点で存在しない。

## 3. 仕様

### 3.1 ECMAScript仕様における識別子定義

ドット記法で使えるプロパティ名は ECMAScript 仕様の **IdentifierName** で定義されている。

- 先頭文字: Unicode カテゴリ `ID_Start` + `$` + `_`
- 2文字目以降: Unicode カテゴリ `ID_Continue` + `$` + `\u200C`（ZWNJ）+ `\u200D`（ZWJ）

`ID_Start` / `ID_Continue` は **Unicode Standard Annex #31（UAX #31）** で定義されており、Unicodeコンソーシアムが公式に管理している。

- UAX #31: https://www.unicode.org/reports/tr31/
- Unicode Character Database（UCD）: 各コードポイントの `ID_Start` / `ID_Continue` 該当情報を収録

### 3.2 正しい識別子判定の正規表現

JavaScriptの正規表現でUnicodeプロパティエスケープを使用する：

```js
const validIdentifier = /^[\p{ID_Start}_$][\p{ID_Continue}$\u200C\u200D]*$/u;
```

### 3.3 ルールの動作

| コード | 期待する動作 |
|--------|------------|
| `foo["bar"]` | エラー → `foo.bar` に自動修正 |
| `foo["あ"]` | エラー → `foo.あ` に自動修正 |
| `foo["日本語"]` | エラー → `foo.日本語` に自動修正 |
| `foo["content-type"]` | OK（ハイフンは識別子に使えない） |
| `foo[bar]` | OK（変数によるアクセス） |
| `foo["class"]` | `allowKeywords: false` の場合はOK |

### 3.4 オプション

ESLint本家の `dot-notation` と同じオプションを踏襲する：

- **`allowKeywords`**（デフォルト: `true`）— `false` にすると予約語のブラケット記法を許可
- **`allowPattern`**（デフォルト: `""`）— 正規表現にマッチするキーのブラケット記法を許可

## 4. 実装

### 4.1 パッケージ構成

```
eslint-plugin-dot-notation-unicode/
├── package.json
├── lib/
│   ├── index.js              # プラグインのエントリポイント
│   └── rules/
│       └── dot-notation.js   # ルール本体
├── tests/
│   └── rules/
│       └── dot-notation.test.js
├── README.md
└── LICENSE
```

### 4.2 package.json

```json
{
  "name": "eslint-plugin-dot-notation-unicode",
  "version": "0.1.0",
  "description": "ESLint dot-notation rule with full Unicode identifier support",
  "main": "lib/index.js",
  "peerDependencies": {
    "eslint": ">=8.0.0"
  },
  "keywords": [
    "eslint",
    "eslintplugin",
    "dot-notation",
    "unicode",
    "identifier",
    "japanese",
    "cjk"
  ]
}
```

### 4.3 プラグインエントリポイント

```js
// lib/index.js
const dotNotation = require("./rules/dot-notation");

module.exports = {
  rules: {
    "dot-notation": dotNotation,
  },
};
```

### 4.4 ルール実装方針

ESLint本家の `lib/rules/dot-notation.js` をベースに、以下を変更する：

1. `validIdentifier` の正規表現を `\p{ID_Start}` / `\p{ID_Continue}` ベースに差し替え
2. その他のロジック（`allowKeywords`、`allowPattern`、自動修正）は本家を踏襲

### 4.5 テストケース

ESLint本家のテストケースを流用しつつ、以下のUnicode固有のケースを追加：

```js
// valid（エラーにならない）
'foo.あ',
'foo.日本語キー',
'foo.変数名',
'foo["content-type"]',    // ハイフン入り → ブラケットOK
'foo["123start"]',         // 数字始まり → ブラケットOK

// invalid（エラーになり自動修正される）
{ code: 'foo["あ"]',       output: 'foo.あ' },
{ code: 'foo["日本語"]',   output: 'foo.日本語' },
{ code: 'foo["한국어"]',   output: 'foo.한국어' },
{ code: 'foo["中文"]',     output: 'foo.中文' },
{ code: 'foo["café"]',     output: 'foo.café' },
```

## 5. 利用方法

### 5.1 インストール

```bash
npm install --save-dev eslint-plugin-dot-notation-unicode
```

### 5.2 ESLint設定（Flat Config）

```js
// eslint.config.js
import plugin from "eslint-plugin-dot-notation-unicode";

export default [
  {
    plugins: { "dot-notation-unicode": plugin },
    rules: {
      "dot-notation": "off",
      "dot-notation-unicode/dot-notation": "error",
    },
  },
];
```

### 5.3 ESLint設定（Legacy Config）

```json
{
  "plugins": ["dot-notation-unicode"],
  "rules": {
    "dot-notation": "off",
    "dot-notation-unicode/dot-notation": "error"
  }
}
```

## 6. 開発時のローカルテスト

npm公開前にプロジェクトで試す方法：

### 6.1 file: 指定（推奨）

```json
{
  "devDependencies": {
    "eslint-plugin-dot-notation-unicode": "file:../eslint-plugin-dot-notation-unicode"
  }
}
```

### 6.2 npm link

```bash
cd eslint-plugin-dot-notation-unicode && npm link
cd <project> && npm link eslint-plugin-dot-notation-unicode
```

## 7. 参考情報

| リソース | URL |
|---------|-----|
| ESLint `dot-notation` ドキュメント | https://eslint.org/docs/latest/rules/dot-notation |
| ESLint `dot-notation` ソースコード | https://github.com/eslint/eslint/blob/main/lib/rules/dot-notation.js |
| `@typescript-eslint/dot-notation` | https://typescript-eslint.io/rules/dot-notation/ |
| Unicode UAX #31（識別子仕様） | https://www.unicode.org/reports/tr31/ |
| ECMAScript仕様（IdentifierName） | https://tc39.es/ecma262/#prod-IdentifierName |
| `is-identifier`（Unicode識別子判定ライブラリ） | https://github.com/sindresorhus/is-identifier |
| ESLint カスタムルール作成ガイド | https://eslint.org/docs/latest/extend/custom-rules |
