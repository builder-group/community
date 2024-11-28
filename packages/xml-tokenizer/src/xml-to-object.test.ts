import { describe, expect, it } from 'vitest';
import { xmlToObject } from './xml-to-object';

describe('xmlToObject function', () => {
	it('should parse a simple XML element', () => {
		const xml = '<root>Hello</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: ['Hello']
		});
	});

	it('should parse nested elements', () => {
		const xml = '<root><child>Value</child></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: [
				{
					local: 'child',
					attributes: [],
					content: ['Value']
				}
			]
		});
	});

	it('should handle attributes', () => {
		const xml = '<root attr="value">Content</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [{ local: 'attr', value: 'value' }],
			content: ['Content']
		});
	});

	it('should handle multiple children with the same name', () => {
		const xml = '<root><child>One</child><child>Two</child></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: [
				{
					local: 'child',
					attributes: [],
					content: ['One']
				},
				{
					local: 'child',
					attributes: [],
					content: ['Two']
				}
			]
		});
	});

	it('should handle namespaces', () => {
		const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>Value</ns:child></ns:root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			prefix: 'ns',
			local: 'root',
			attributes: [{ prefix: 'xmlns', local: 'ns', value: 'http://example.com' }],
			content: [
				{
					prefix: 'ns',
					local: 'child',
					attributes: [],
					content: ['Value']
				}
			]
		});
	});

	it('should handle CDATA sections', () => {
		const xml = '<root><![CDATA[<special> characters & such]]></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: ['<special> characters & such']
		});
	});

	it('should handle empty elements', () => {
		const xml = '<root><empty/></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: [
				{
					local: 'empty',
					attributes: [],
					content: []
				}
			]
		});
	});

	it('should handle complex nested structures', () => {
		const xml = `
      <root>
        <child1 attr="val1">
          <grandchild>GC1</grandchild>
          <grandchild>GC2</grandchild>
        </child1>
        <child2>
          <grandchild attr="val2">GC3</grandchild>
        </child2>
      </root>
    `;
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: [
				{
					local: 'child1',
					attributes: [{ local: 'attr', value: 'val1' }],
					content: [
						{
							local: 'grandchild',
							attributes: [],
							content: ['GC1']
						},
						{
							local: 'grandchild',
							attributes: [],
							content: ['GC2']
						}
					]
				},
				{
					local: 'child2',
					attributes: [],
					content: [
						{
							local: 'grandchild',
							attributes: [{ local: 'attr', value: 'val2' }],
							content: ['GC3']
						}
					]
				}
			]
		});
	});

	it('should ignore comments', () => {
		const xml = '<root><!-- This is a comment -->Value</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: ['Value']
		});
	});

	it('should ignore processing instructions', () => {
		const xml = '<?xml version="1.0" encoding="UTF-8"?><root>Value</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: ['Value']
		});
	});

	it('should handle mixed content', () => {
		const xml = '<root>Text <child>Child Text</child> More Text</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [],
			content: [
				'Text ',
				{
					local: 'child',
					attributes: [],
					content: ['Child Text']
				},
				' More Text'
			]
		});
	});

	it('should handle multiple attributes', () => {
		const xml = '<root attr1="value1" attr2="value2">Content</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			local: 'root',
			attributes: [
				{ local: 'attr1', value: 'value1' },
				{ local: 'attr2', value: 'value2' }
			],
			content: ['Content']
		});
	});
});
