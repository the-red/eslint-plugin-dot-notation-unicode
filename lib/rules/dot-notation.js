/**
 * @fileoverview Rule to warn about using dot notation instead of square bracket notation when possible.
 * Extended to support Unicode identifiers (Japanese, Chinese, Korean, etc.)
 * @author Hisaki Akaza
 *
 * Based on ESLint's dot-notation rule:
 * https://github.com/eslint/eslint/blob/main/lib/rules/dot-notation.js
 */
"use strict";

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

// Unicode-aware identifier validation regex
// Compliant with ECMAScript IdentifierName specification
const validIdentifier = /^[\p{ID_Start}_$][\p{ID_Continue}$\u200C\u200D]*$/u;

// Characters not recognized as identifiers in TypeScript 5.4 and earlier / Node.js < 18.20
// These are included in Unicode ID_Continue but not supported by older parsers
// Fixed in TypeScript 5.5: https://github.com/microsoft/TypeScript/pull/58521
const tsIncompatibleChars = /[\u30FB\u200C\u200D]/u; // ・, ZWNJ, ZWJ

/**
 * Check if a string is a valid identifier name
 * @param {string} name The string to check
 * @param {boolean} legacyParserSupport Whether to enable legacy parser compatibility
 * @returns {boolean} True if valid identifier
 */
function isValidIdentifierName(name, legacyParserSupport) {
	if (!validIdentifier.test(name)) {
		return false;
	}
	// In legacy parser compatibility mode, exclude problematic characters
	if (legacyParserSupport && tsIncompatibleChars.test(name)) {
		return false;
	}
	return true;
}

// `null` literal must be handled separately.
const literalTypesToCheck = new Set(["string", "boolean"]);

// JavaScript reserved keywords
const keywords = [
	"break",
	"case",
	"catch",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"finally",
	"for",
	"function",
	"if",
	"in",
	"instanceof",
	"new",
	"return",
	"switch",
	"this",
	"throw",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"class",
	"const",
	"enum",
	"export",
	"extends",
	"import",
	"super",
	"implements",
	"interface",
	"package",
	"private",
	"protected",
	"public",
	"static",
	"null",
	"true",
	"false",
];

//------------------------------------------------------------------------------
// Utility Functions
//------------------------------------------------------------------------------

/**
 * Check if token is an opening bracket
 * @param {Token} token Token to check
 * @returns {boolean} True if opening bracket
 */
function isOpeningBracketToken(token) {
	return token.type === "Punctuator" && token.value === "[";
}

/**
 * Check if node is a null literal
 * @param {ASTNode} node Node to check
 * @returns {boolean} True if null literal
 */
function isNullLiteral(node) {
	return node.type === "Literal" && node.value === null && !node.bigint;
}

/**
 * Check if node is a decimal integer
 * @param {ASTNode} node Node to check
 * @returns {boolean} True if decimal integer
 */
function isDecimalInteger(node) {
	return (
		node.type === "Literal" &&
		typeof node.value === "number" &&
		Number.isInteger(node.value) &&
		// Ensure it's not hex, octal, or binary (supports numeric separators)
		/^(?:0|[1-9][\d_]*)$/u.test(node.raw)
	);
}

/**
 * Check if node is a static template literal
 * @param {ASTNode} node Node to check
 * @returns {boolean} True if static template literal
 */
function isStaticTemplateLiteral(node) {
	return (
		node.type === "TemplateLiteral" &&
		node.expressions.length === 0 &&
		node.quasis.length === 1
	);
}

/**
 * Check if two tokens can be adjacent
 * @param {string} leftValue Left side value
 * @param {Token} rightToken Right side token
 * @returns {boolean} True if can be adjacent
 */
function canTokensBeAdjacent(leftValue, rightToken) {
	const leftEndsWithIdChar = /[\p{ID_Continue}$\u200C\u200D]$/u.test(
		leftValue,
	);
	const rightStartsWithIdChar = /^[\p{ID_Start}_$\d]/u.test(rightToken.value);

	if (leftEndsWithIdChar && rightStartsWithIdChar) {
		return false;
	}
	return true;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: "suggestion",

		docs: {
			description: "Enforce dot notation whenever possible",
			recommended: false,
			url: "https://github.com/the-red/eslint-plugin-dot-notation-unicode",
		},

		schema: [
			{
				type: "object",
				properties: {
					allowKeywords: {
						type: "boolean",
						default: true,
					},
					allowPattern: {
						type: "string",
						default: "",
					},
					legacyParserSupport: {
						type: "boolean",
						default: false,
					},
				},
				additionalProperties: false,
			},
		],

		fixable: "code",

		messages: {
			useDot: "[{{key}}] is better written in dot notation.",
			useBrackets: ".{{key}} is a syntax error.",
		},
	},

	create(context) {
		const options = context.options[0] || {};
		const allowKeywords = options.allowKeywords !== false;
		const legacyParserSupport = options.legacyParserSupport === true;
		const sourceCode = context.sourceCode || context.getSourceCode();

		let allowPattern;

		if (options.allowPattern) {
			allowPattern = new RegExp(options.allowPattern, "u");
		}

		/**
		 * Check if the property is valid dot notation
		 * @param {ASTNode} node The dot notation node
		 * @param {string|boolean|null} value Value which is to be checked
		 * @returns {void}
		 */
		function checkComputedProperty(node, value) {
			if (
				isValidIdentifierName(value, legacyParserSupport) &&
				(allowKeywords || !keywords.includes(String(value))) &&
				!(allowPattern && allowPattern.test(value))
			) {
				const formattedValue =
					node.property.type === "Literal"
						? JSON.stringify(value)
						: `\`${value}\``;

				context.report({
					node: node.property,
					messageId: "useDot",
					data: {
						key: formattedValue,
					},
					*fix(fixer) {
						const leftBracket = sourceCode.getTokenAfter(
							node.object,
							isOpeningBracketToken,
						);
						const rightBracket = sourceCode.getLastToken(node);
						const nextToken = sourceCode.getTokenAfter(node);

						// Don't perform any fixes if there are comments inside the brackets.
						if (
							sourceCode.commentsExistBetween(
								leftBracket,
								rightBracket,
							)
						) {
							return;
						}

						// Replace the brackets by an identifier.
						if (!node.optional) {
							const tokenBeforeBracket =
								sourceCode.getTokenBefore(leftBracket);
							const needsSpace =
								isDecimalInteger(node.object) &&
								tokenBeforeBracket.value !== ")";
							yield fixer.insertTextBefore(
								leftBracket,
								needsSpace ? " ." : ".",
							);
						}
						yield fixer.replaceTextRange(
							[leftBracket.range[0], rightBracket.range[1]],
							String(value),
						);

						// Insert a space after the property if it will be connected to the next token.
						if (
							nextToken &&
							rightBracket.range[1] === nextToken.range[0] &&
							!canTokensBeAdjacent(String(value), nextToken)
						) {
							yield fixer.insertTextAfter(node, " ");
						}
					},
				});
			}
		}

		return {
			MemberExpression(node) {
				if (
					node.computed &&
					node.property.type === "Literal" &&
					(literalTypesToCheck.has(typeof node.property.value) ||
						isNullLiteral(node.property))
				) {
					checkComputedProperty(node, node.property.value);
				}
				if (node.computed && isStaticTemplateLiteral(node.property)) {
					checkComputedProperty(
						node,
						node.property.quasis[0].value.cooked,
					);
				}
				if (
					!allowKeywords &&
					!node.computed &&
					node.property.type === "Identifier" &&
					keywords.includes(String(node.property.name))
				) {
					context.report({
						node: node.property,
						messageId: "useBrackets",
						data: {
							key: node.property.name,
						},
						*fix(fixer) {
							const dotToken = sourceCode.getTokenBefore(
								node.property,
							);

							// A statement that starts with `let[` is parsed as a destructuring variable declaration, not a MemberExpression.
							if (
								node.object.type === "Identifier" &&
								node.object.name === "let" &&
								!node.optional
							) {
								return;
							}

							// Don't perform any fixes if there are comments between the dot and the property name.
							if (
								sourceCode.commentsExistBetween(
									dotToken,
									node.property,
								)
							) {
								return;
							}

							// Replace the identifier to brackets.
							if (!node.optional) {
								yield fixer.remove(dotToken);
							}
							yield fixer.replaceText(
								node.property,
								`["${node.property.name}"]`,
							);
						},
					});
				}
			},
		};
	},
};
