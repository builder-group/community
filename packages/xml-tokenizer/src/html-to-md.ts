import { htmlConfig } from './config';
import { getXmlStringNodeContent, xmlToString } from './xml-to-string';

/**
 * Converts HTML to Markdown using a streaming XML tokenizer approach.
 *
 * @param html - The HTML string to convert
 * @returns The converted Markdown string
 *
 * @remarks
 * This implementation uses a streaming approach which has some limitations:
 * - Transformers cannot look ahead to see if they're the last child
 * - Sibling context is limited to what's already been processed
 * - Complex formatting decisions may require post-processing
 *
 * For optimal results, transformers should be designed to work independently
 * and handle their own spacing/formatting needs.
 */
export function htmlToMarkdown(html: string): string {
	return xmlToString(html, {
		xmlOptions: htmlConfig,
		transformers: {
			h1: (node) => `# ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			h2: (node) => `## ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			h3: (node) => `### ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			h4: (node) => `#### ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			h5: (node) => `##### ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			h6: (node) => `###### ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			p: (node) => `${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			strong: (node) => `**${normalizeWhitespace(getXmlStringNodeContent(node))}**`,
			b: (node) => `**${normalizeWhitespace(getXmlStringNodeContent(node))}**`,
			em: (node) => `*${normalizeWhitespace(getXmlStringNodeContent(node))}*`,
			i: (node) => `*${normalizeWhitespace(getXmlStringNodeContent(node))}*`,
			a: (node) => {
				const href = node.attributes.find((attr) => attr.local === 'href')?.value;
				const text = normalizeWhitespace(getXmlStringNodeContent(node));
				return href != null ? `[${text}](${href})` : text;
			},
			ul: (node) => getXmlStringNodeContent(node),
			ol: (node) => getXmlStringNodeContent(node),
			li: (node, stack) => {
				const content = normalizeWhitespace(getXmlStringNodeContent(node));
				// Calculate indentation based on stack depth
				let indentLevel = 0;
				for (let i = stack.length - 1; i >= 0; i--) {
					const stackItem = stack[i];
					if (stackItem && (stackItem.local === 'ul' || stackItem.local === 'ol')) {
						indentLevel++;
					}
				}
				const indent = '\t'.repeat(Math.max(0, indentLevel - 1));
				return `${indent}- ${content}\n`;
			},
			blockquote: (node) => `> ${normalizeWhitespace(getXmlStringNodeContent(node))}\n\n`,
			hr: () => `---\n\n`,
			br: () => '\n',
			code: (node) => `\`${normalizeWhitespace(getXmlStringNodeContent(node))}\``,
			pre: (node) => `\n\`\`\`\n${getXmlStringNodeContent(node)}\n\`\`\`\n\n`,
			div: (node) => getXmlStringNodeContent(node)
		}
	});
}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}
