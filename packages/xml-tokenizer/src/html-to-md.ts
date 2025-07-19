import { htmlConfig } from './config';
import {
	getXmlStringNodeContent,
	TXmlStringNode,
	TXmlToStringOptions,
	xmlToString
} from './xml-to-string';

/**
 * Converts HTML to Markdown using a streaming XML tokenizer approach.
 *
 * @param html - The HTML string to convert
 * @param options - Configuration options for the conversion
 * @returns The converted Markdown string with node tree
 *
 * @remarks
 * This implementation uses a streaming approach where transformers can only see
 * previously processed nodes. Spacing is determined by looking at the previous
 * sibling element type (block vs inline).
 */
export function htmlToMarkdown(
	html: string,
	options: THtmlToMarkdownOptions = {}
): TXmlStringNode & { string: string } {
	const { xmlOptions = htmlConfig, transformers, ...rest } = options;

	return xmlToString(html, {
		xmlOptions,
		transformers: {
			h1: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}# ${content}`;
			},
			h2: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}## ${content}`;
			},
			h3: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}### ${content}`;
			},
			h4: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}#### ${content}`;
			},
			h5: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}##### ${content}`;
			},
			h6: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}###### ${content}`;
			},
			p: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}${content}`;
			},
			strong: (node) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				return `**${content}**`;
			},
			b: (node) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				return `**${content}**`;
			},
			em: (node) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				return `*${content}*`;
			},
			i: (node) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				return `*${content}*`;
			},
			a: (node) => {
				const href = node.attributes.find((attr) => attr.local === 'href')?.value;
				const text = normalizeWhitespace(getXmlStringNodeContent(node));
				if (text === '') {
					return '';
				}

				return href != null ? `[${text}](${href})` : text;
			},
			ul: (node, stack) => {
				const content = getXmlStringNodeContent(node);
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}${content}`;
			},
			ol: (node, stack) => {
				const content = getXmlStringNodeContent(node);
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}${content}`;
			},
			li: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const indentLevel = getListIndentLevel(stack);
				const indent = '\t'.repeat(Math.max(0, indentLevel - 1));
				return `${indent}- ${content}\n`;
			},
			blockquote: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}> ${content}`;
			},
			hr: (_, stack) => {
				const spacing = getBlockSpacing(stack);
				return `${spacing}---`;
			},
			br: () => '\n',
			code: (node) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				if (content === '') {
					return '';
				}

				return `\`${content}\``;
			},
			pre: (node, stack) => {
				const content = getXmlStringNodeContent(node);
				if (content === '') {
					return '';
				}

				const spacing = getBlockSpacing(stack);
				return `${spacing}\`\`\`\n${content}\n\`\`\``;
			},
			...transformers
		},
		...rest
	});
}

interface THtmlToMarkdownOptions extends TXmlToStringOptions {}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function getBlockSpacing(stack: TXmlStringNode[]): string {
	if (stack.length === 0) {
		return '';
	}

	const parent = stack[stack.length - 1];
	if (parent == null || parent.content.length === 0) {
		return '';
	}

	// Find the previous sibling that has been processed
	// and determine the spacing needed based on the previous sibling type
	for (let i = parent.content.length - 1; i >= 0; i--) {
		const sibling = parent.content[i];
		if (typeof sibling === 'object' && sibling.string != null && sibling.string !== '') {
			if (BLOCK_ELEMENTS.has(sibling.local)) {
				return '\n\n';
			}
			if (INLINE_ELEMENTS.has(sibling.local)) {
				return '\n';
			}
		}
	}

	return '';
}

function getListIndentLevel(stack: TXmlStringNode[]): number {
	let indentLevel = 0;
	for (let i = stack.length - 1; i >= 0; i--) {
		const stackItem = stack[i];
		if (stackItem && (stackItem.local === 'ul' || stackItem.local === 'ol')) {
			indentLevel++;
		}
	}
	return indentLevel;
}

const BLOCK_ELEMENTS = new Set([
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'p',
	'div',
	'blockquote',
	'hr',
	'pre',
	'ul',
	'ol',
	'li'
]);

const INLINE_ELEMENTS = new Set(['strong', 'b', 'em', 'i', 'a', 'code', 'br']);
