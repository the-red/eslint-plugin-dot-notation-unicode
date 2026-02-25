/**
 * @fileoverview Tests for Unicode identifier support in dot-notation rule
 * @author Hisaki Akaza
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
 * Quote a string in "double quotes" because it's painful
 * with a double-quoted string literal
 * @param {string} str The string to quote
 * @returns {string} `"${str}"`
 */
function q(str) {
	return `"${str}"`;
}

//------------------------------------------------------------------------------
// Tests - Unicode identifier support (main purpose of this plugin)
//------------------------------------------------------------------------------

ruleTester.run("dot-notation", rule, {
	valid: [
		// Unicode identifiers with dot notation (no error)
		"foo.あ",
		"foo.日本語キー",
		"foo.変数名",
		"foo.français",
		"foo.العربية",
		"foo.english",
		"foo.한국어",
		"foo.中文",

		// Bracket notation OK when containing invalid identifier characters
		'foo["content-type"]', // hyphen
		'foo["123start"]', // starts with number
		'foo["foo bar"]', // space
		'foo[""]', // empty string
		'foo["foo.bar"]', // dot

		// Variable access is OK
		"foo[bar]",
		"foo[bar.baz]",
	],

	invalid: [
		// Japanese identifier with bracket notation
		{
			code: 'foo["あ"]',
			output: "foo.あ",
			errors: [{ messageId: "useDot", data: { key: q("あ") } }],
		},
		{
			code: 'foo["日本語"]',
			output: "foo.日本語",
			errors: [{ messageId: "useDot", data: { key: q("日本語") } }],
		},
		{
			code: 'foo["日本語キー"]',
			output: "foo.日本語キー",
			errors: [{ messageId: "useDot", data: { key: q("日本語キー") } }],
		},
		{
			code: 'foo["変数名"]',
			output: "foo.変数名",
			errors: [{ messageId: "useDot", data: { key: q("変数名") } }],
		},

		// Korean
		{
			code: 'foo["한국어"]',
			output: "foo.한국어",
			errors: [{ messageId: "useDot", data: { key: q("한국어") } }],
		},

		// Chinese
		{
			code: 'foo["中文"]',
			output: "foo.中文",
			errors: [{ messageId: "useDot", data: { key: q("中文") } }],
		},

		// French (accented characters)
		{
			code: 'foo["français"]',
			output: "foo.français",
			errors: [{ messageId: "useDot", data: { key: q("français") } }],
		},

		// Arabic (RTL language)
		{
			code: 'foo["العربية"]',
			output: "foo.العربية",
			errors: [{ messageId: "useDot", data: { key: q("العربية") } }],
		},

		// English (for comparison)
		{
			code: 'foo["english"]',
			output: "foo.english",
			errors: [{ messageId: "useDot", data: { key: q("english") } }],
		},

		// Template literal with Unicode
		{
			code: "foo[`日本語`]",
			output: "foo.日本語",
			errors: [{ messageId: "useDot", data: { key: "`日本語`" } }],
		},
	],
});
