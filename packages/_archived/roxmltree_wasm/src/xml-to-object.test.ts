import { describe, expect, it } from 'vitest';
import { xmlToObject } from './xml-to-object';

describe('xmlToObject function', () => {
	it('should parse a simple XML element', () => {
		const xml = '<root>Hello</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: ['Hello']
		});
	});

	it('should parse nested elements', () => {
		const xml = '<root><child>Value</child></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: [
				{
					tagName: 'child',
					attributes: {},
					children: ['Value']
				}
			]
		});
	});

	it('should handle attributes', () => {
		const xml = '<root attr="value">Content</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: { attr: 'value' },
			children: ['Content']
		});
	});

	it('should handle multiple children with the same name', () => {
		const xml = '<root><child>One</child><child>Two</child></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: [
				{
					tagName: 'child',
					attributes: {},
					children: ['One']
				},
				{
					tagName: 'child',
					attributes: {},
					children: ['Two']
				}
			]
		});
	});

	it('should handle namespaces', () => {
		const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>Value</ns:child></ns:root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'ns:root',
			attributes: { 'xmlns:ns': 'http://example.com' },
			children: [
				{
					tagName: 'ns:child',
					attributes: {},
					children: ['Value']
				}
			]
		});
	});

	it('should handle CDATA sections', () => {
		const xml = '<root><![CDATA[<special> characters & such]]></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: ['<special> characters & such']
		});
	});

	it('should handle empty elements', () => {
		const xml = '<root><empty/></root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: [
				{
					tagName: 'empty',
					attributes: {},
					children: []
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
			tagName: 'root',
			attributes: {},
			children: [
				{
					tagName: 'child1',
					attributes: { attr: 'val1' },
					children: [
						{
							tagName: 'grandchild',
							attributes: {},
							children: ['GC1']
						},
						{
							tagName: 'grandchild',
							attributes: {},
							children: ['GC2']
						}
					]
				},
				{
					tagName: 'child2',
					attributes: {},
					children: [
						{
							tagName: 'grandchild',
							attributes: { attr: 'val2' },
							children: ['GC3']
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
			tagName: 'root',
			attributes: {},
			children: ['Value']
		});
	});

	it('should handle processing instructions', () => {
		const xml = '<?xml version="1.0" encoding="UTF-8"?><root>Value</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: ['Value']
		});
	});

	it('should handle mixed content', () => {
		const xml = '<root>Text <child>Child Text</child> More Text</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: {},
			children: [
				'Text ',
				{
					tagName: 'child',
					attributes: {},
					children: ['Child Text']
				},
				' More Text'
			]
		});
	});

	it('should handle multiple attributes', () => {
		const xml = '<root attr1="value1" attr2="value2">Content</root>';
		const result = xmlToObject(xml);
		expect(result).toEqual({
			tagName: 'root',
			attributes: { attr1: 'value1', attr2: 'value2' },
			children: ['Content']
		});
	});
});
