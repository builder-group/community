import { describe, expect, it } from 'vitest';
import {
	getXmlStringNodeContent,
	xmlToString,
	type TXmlStringNode,
	type TXmlStringTransformers
} from './xml-to-string';

describe('xmlToString function', () => {
	it('should convert XML to string using transformers', () => {
		const xml = '<root><title>Hello World</title><content>Some text</content></root>';

		const transformers: TXmlStringTransformers = {
			title: (node) => `# ${getXmlStringNodeContent(node)}\n\n`,
			content: (node) => `${getXmlStringNodeContent(node)}\n\n`
		};

		const result = xmlToString(xml, { transformers });
		expect(result.string).toBe('# Hello World\n\nSome text\n\n');
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
		expect(result.string).toBe('[Click here](https://example.com)');
	});

	it('should handle nested elements', () => {
		const xml = '<root><div><strong>Bold</strong> and <em>italic</em></div></root>';

		const transformers: TXmlStringTransformers = {
			div: (node) => `${getXmlStringNodeContent(node)}\n\n`,
			strong: (node) => `**${getXmlStringNodeContent(node)}**`,
			em: (node) => `*${getXmlStringNodeContent(node)}*`
		};

		const result = xmlToString(xml, { transformers });
		expect(result.string).toBe('**Bold** and *italic*\n\n');
	});

	it('should skip specified nodes', () => {
		const xml =
			'<root><title>Hello</title><ignored>This should be ignored</ignored><content>World</content></root>';

		const transformers: TXmlStringTransformers = {
			title: (node) => `# ${getXmlStringNodeContent(node)}\n\n`,
			content: (node) => `${getXmlStringNodeContent(node)}\n\n`
		};

		const result = xmlToString(xml, { transformers, skipNodes: ['ignored'] });
		expect(result.string).toBe('# Hello\n\nWorld\n\n');
	});

	it('should use default transformer for untransformed nodes', () => {
		const xml = '<root><title>Hello</title><untransformed>World</untransformed></root>';

		const transformers: TXmlStringTransformers = {
			title: (node) => `# ${getXmlStringNodeContent(node)}\n\n`
		};

		const result = xmlToString(xml, { transformers });
		expect(result.string).toBe('# Hello\n\nWorld');
	});

	it('should preserve tree when preserveTree is true', () => {
		const xml = '<root><div><span>Hello</span></div></root>';

		const transformers: TXmlStringTransformers = {
			div: (node) => `[${getXmlStringNodeContent(node)}]`
		};

		const result = xmlToString(xml, { transformers, preserveTree: true });
		expect(result.string).toBe('[Hello]');
		expect(result.content.length).toBeGreaterThan(0);
	});

	it('should clear processed nodes when preserveTree is false', () => {
		const xml = '<root><div><span>Hello</span></div></root>';

		const transformers: TXmlStringTransformers = {
			div: (node) => `[${getXmlStringNodeContent(node)}]`
		};

		const result = xmlToString(xml, { transformers, preserveTree: false });
		expect(result.string).toBe('[Hello]');
	});

	it('should handle empty elements', () => {
		const xml = '<root><empty/><content>Text</content></root>';

		const transformers: TXmlStringTransformers = {
			content: (node) => getXmlStringNodeContent(node)
		};

		const result = xmlToString(xml, { transformers });
		expect(result.string).toBe('Text');
	});

	it('should handle text and CDATA content', () => {
		const xml = '<root><text>Hello <![CDATA[World]]>!</text></root>';

		const transformers: TXmlStringTransformers = {
			text: (node) => getXmlStringNodeContent(node)
		};

		const result = xmlToString(xml, { transformers });
		expect(result.string).toBe('Hello World!');
	});

	it('should provide access to the full tree structure', () => {
		const xml = '<root><title>Hello</title><content>World</content></root>';

		const transformers: TXmlStringTransformers = {
			title: (node) => `# ${getXmlStringNodeContent(node)}\n\n`,
			content: (node) => `${getXmlStringNodeContent(node)}\n\n`
		};

		const result = xmlToString(xml, { transformers, preserveTree: true });

		// Access the string directly
		expect(result.string).toBe('# Hello\n\nWorld\n\n');

		// Access the tree structure - our wrapper root contains the actual XML root
		expect(result.local).toBe('root');
		expect(result.content.length).toBe(1);

		const xmlRoot = result.content[0] as TXmlStringNode;
		expect(xmlRoot.local).toBe('root');
		expect(xmlRoot.content.length).toBe(2);
		expect(xmlRoot.content[0]).toHaveProperty('local', 'title');
		expect(xmlRoot.content[1]).toHaveProperty('local', 'content');
	});
});

describe('getXmlStringNodeContent function', () => {
	it('should return empty string for node without content', () => {
		const node = {
			local: 'test',
			attributes: [],
			content: []
		};

		const result = getXmlStringNodeContent(node);
		expect(result).toBe('');
	});

	it('should concatenate text content', () => {
		const node = {
			local: 'test',
			attributes: [],
			content: ['Hello', ' ', 'World']
		};

		const result = getXmlStringNodeContent(node);
		expect(result).toBe('Hello World');
	});

	it('should get string from child nodes', () => {
		const childNode = {
			local: 'child',
			attributes: [],
			content: ['Child text'],
			string: 'Processed child'
		};

		const node = {
			local: 'parent',
			attributes: [],
			content: [childNode, ' and ', 'more text']
		};

		const result = getXmlStringNodeContent(node);
		expect(result).toBe('Processed child and more text');
	});
});
