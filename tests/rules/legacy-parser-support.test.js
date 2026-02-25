/**
 * @fileoverview Tests for legacyParserSupport option
 * @author Hisaki Akaza
 *
 * In TypeScript < 5.5 or Node.js < 18.20, some Unicode characters
 * (e.g., "・" U+30FB) are not recognized as identifiers.
 * The legacyParserSupport option ensures compatibility with these environments.
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../lib/rules/dot-notation");
const { RuleTester } = require("eslint");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
	languageOptions: {
		ecmaVersion: 2020,
	},
});

/**
 * Quote a string in "double quotes"
 * @param {string} str The string to quote
 * @returns {string} `"${str}"`
 */
function q(str) {
	return `"${str}"`;
}

//------------------------------------------------------------------------------
// Tests - Default behavior (Unicode compliant)
//------------------------------------------------------------------------------

ruleTester.run("dot-notation (default: Unicode compliant)", rule, {
	valid: [
		// Normal Unicode identifiers (dot notation)
		"foo.あい",
		"foo.テストケース",
	],

	invalid: [
		// By default, identifiers containing "・" are also converted (Unicode compliant)
		{
			code: 'foo["送信・受信"]', // U+30FB KATAKANA MIDDLE DOT
			output: "foo.送信・受信",
			errors: [{ messageId: "useDot", data: { key: q("送信・受信") } }],
		},
		{
			code: 'foo["中・黒"]',
			output: "foo.中・黒",
			errors: [{ messageId: "useDot", data: { key: q("中・黒") } }],
		},
		{
			code: 'foo["テスト・ケース"]',
			output: "foo.テスト・ケース",
			errors: [
				{ messageId: "useDot", data: { key: q("テスト・ケース") } },
			],
		},
		// Halfwidth katakana middle dot (U+FF65) is also converted by default
		{
			code: 'foo["送信･受信"]', // U+FF65 HALFWIDTH KATAKANA MIDDLE DOT
			output: "foo.送信･受信",
			errors: [{ messageId: "useDot", data: { key: q("送信･受信") } }],
		},
		// Normal Unicode identifiers are also converted
		{
			code: 'foo["あい"]',
			output: "foo.あい",
			errors: [{ messageId: "useDot", data: { key: q("あい") } }],
		},
	],
});

//------------------------------------------------------------------------------
// Tests - legacyParserSupport: true
//------------------------------------------------------------------------------

ruleTester.run("dot-notation (legacyParserSupport: true)", rule, {
	valid: [
		// With legacyParserSupport: true, identifiers containing "・" are not converted
		{
			code: 'foo["送信・受信"]', // U+30FB KATAKANA MIDDLE DOT
			options: [{ legacyParserSupport: true }],
		},
		{
			code: 'foo["あ・い"]',
			options: [{ legacyParserSupport: true }],
		},
		{
			code: 'foo["テスト・ケース"]',
			options: [{ legacyParserSupport: true }],
		},
		// Halfwidth katakana middle dot (U+FF65) is also not converted
		{
			code: 'foo["送信･受信"]', // U+FF65 HALFWIDTH KATAKANA MIDDLE DOT
			options: [{ legacyParserSupport: true }],
		},
		// Identifiers containing ZWNJ/ZWJ are also not converted
		{
			code: 'foo["test\u200Cname"]', // ZWNJ
			options: [{ legacyParserSupport: true }],
		},
		{
			code: 'foo["test\u200Dname"]', // ZWJ
			options: [{ legacyParserSupport: true }],
		},
	],

	invalid: [
		// Identifiers without problematic characters are converted
		{
			code: 'foo["あい"]',
			output: "foo.あい",
			options: [{ legacyParserSupport: true }],
			errors: [{ messageId: "useDot", data: { key: q("あい") } }],
		},
		{
			code: 'foo["テストケース"]',
			output: "foo.テストケース",
			options: [{ legacyParserSupport: true }],
			errors: [{ messageId: "useDot", data: { key: q("テストケース") } }],
		},
	],
});
