/**
 * @fileoverview ESLint plugin for dot-notation rule with Unicode identifier support
 * @author Hisaki Akaza
 */
"use strict";

const dotNotation = require("./rules/dot-notation");

module.exports = {
	rules: {
		"dot-notation": dotNotation,
	},
};
