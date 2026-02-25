# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ESLint標準の `dot-notation` ルールがUnicode識別子（日本語・中国語・韓国語等）に対応していない問題を解決するESLintプラグイン。

ブラケット記法 `obj['日本語キー']` をドット記法 `obj.日本語キー` に矯正する。

## 設計ドキュメント

詳細な設計は [DESIGN.md](DESIGN.md) を参照。背景、仕様、実装方針、テストケースが記載されている。

## 技術的なポイント

### 識別子判定の正規表現

ESLint本家の問題のある実装:
```js
const validIdentifier = /^[a-zA-Z_$][\w$]*$/u;
```

本プラグインで使用すべき正しい実装:
```js
const validIdentifier = /^[\p{ID_Start}_$][\p{ID_Continue}$\u200C\u200D]*$/u;
```

### ESLint本家との互換性

- `allowKeywords` と `allowPattern` オプションを本家と同様にサポート
- 自動修正（autofix）機能を実装

## 開発コマンド

パッケージマネージャーはyarnを使用。

```bash
yarn install    # 依存関係のインストール
yarn test       # テスト実行
```

## パッケージ構成（計画）

```
lib/
├── index.js              # プラグインのエントリポイント
└── rules/
    └── dot-notation.js   # ルール本体
tests/
└── rules/
    └── dot-notation.test.js
```
