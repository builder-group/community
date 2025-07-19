import { describe, expect, it } from 'vitest';
import { getXmlStringNodeContent, xmlToString, type TXmlStringTransformers } from './xml-to-string';

describe('xmlToString function', () => {
	it('should convert XML to string using transformers', () => {
		const xml = '<root><title>Hello World</title><content>Some text</content></root>';

		const transformers: TXmlStringTransformers = {
			title: (node) => `# ${getXmlStringNodeContent(node)}\n\n`,
			content: (node) => `${getXmlStringNodeContent(node)}\n\n`
		};

		const result = xmlToString(xml, { transformers });
		expect(result).toBe('# Hello World\n\nSome text\n\n');
	});

	it('should ignore tags without transformers', () => {
		const xml =
			'<root><title>Hello</title><ignored>This should be ignored</ignored><content>World</content></root>';

		const transformers: TXmlStringTransformers = {
			title: (node) => `# ${getXmlStringNodeContent(node)}\n\n`,
			content: (node) => `${getXmlStringNodeContent(node)}\n\n`
		};

		const result = xmlToString(xml, { transformers });
		expect(result).toBe('# Hello\n\nWorld\n\n');
	});

	it('should handle attributes in transformers', () => {
		const xml = '<root><link href="https://example.com">Click here</link></root>';

		const transformers: TXmlStringTransformers = {
			link: (node) => {
				const href = node.attributes.find((attr) => attr.local === 'href')?.value;
				const text = getXmlStringNodeContent(node);
				return href != null ? `[${text}](${href})` : text;
			}
		};

		const result = xmlToString(xml, { transformers });
		expect(result).toBe('[Click here](https://example.com)');
	});

	it('should handle nested elements', () => {
		const xml = '<root><div><strong>Bold</strong> and <em>italic</em></div></root>';

		const transformers: TXmlStringTransformers = {
			div: (node) => `${getXmlStringNodeContent(node)}\n\n`,
			strong: (node) => `**${getXmlStringNodeContent(node)}**`,
			em: (node) => `*${getXmlStringNodeContent(node)}*`
		};

		const result = xmlToString(xml, { transformers });
		expect(result).toBe('**Bold** and *italic*\n\n');
	});
});
