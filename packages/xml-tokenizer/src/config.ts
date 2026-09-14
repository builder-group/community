import { TXmlStreamOptions } from './tokenizer';

/**
 * Default XML configuration with strict XML compliance.
 */
export const xmlConfig: TXmlStreamOptions = {
	strictDocument: true,
	lowercaseNames: false,
	allowDtd: true,
	rawTextElements: null,
	implicitSelfClosingElements: null,
	contextSliceSize: 30
};

/**
 * HTML configuration with HTML-specific settings.
 * - Non-strict document structure
 * - ASCII lowercase element and attribute names
 * - Raw text elements like script and style
 * - Implicit self-closing elements (void elements in HTML)
 */
export const htmlConfig: TXmlStreamOptions = {
	strictDocument: false,
	lowercaseNames: true,
	allowDtd: true,
	rawTextElements: ['script', 'style', 'title', 'textarea'],
	implicitSelfClosingElements: [
		'area',
		'base',
		'br',
		'col',
		'embed',
		'hr',
		'img',
		'input',
		'link',
		'meta',
		'param',
		'source',
		'track',
		'wbr'
	],
	contextSliceSize: 30
};

/**
 * SVG configuration with SVG-specific settings.
 */
export const svgConfig: TXmlStreamOptions = {
	strictDocument: false,
	lowercaseNames: false,
	allowDtd: true,
	rawTextElements: ['style'],
	implicitSelfClosingElements: [],
	contextSliceSize: 30
};
