import { describe, expect, it } from 'vitest';
import { xmlToSimplifiedObject } from './xml-to-simplified-object';

describe('xmlToObject function', () => {
	it('should parse a simple XML element', () => {
		const xml = '<root>Hello</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					text: 'Hello'
				}
			]
		});
	});

	it('should parse nested elements', () => {
		const xml = '<root><child>Value</child></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					_child: [
						{
							text: 'Value'
						}
					]
				}
			]
		});
	});

	it('should handle attributes', () => {
		const xml = '<root attr="value">Content</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					attributes: {
						attr: 'value'
					},
					text: 'Content'
				}
			]
		});
	});

	it('should handle multiple children with the same name', () => {
		const xml = '<root><child>One</child><child>Two</child></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					_child: [{ text: 'One' }, { text: 'Two' }]
				}
			]
		});
	});

	it('should handle namespaces', () => {
		const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>Value</ns:child></ns:root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			'_ns:root': [
				{
					'attributes': {
						'xmlns:ns': 'http://example.com'
					},
					'_ns:child': [
						{
							text: 'Value'
						}
					]
				}
			]
		});
	});

	it('should handle CDATA sections', () => {
		const xml = '<root><![CDATA[<special> characters & such]]></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					text: '<special> characters & such'
				}
			]
		});
	});

	it('should handle empty elements', () => {
		const xml = '<root><empty/></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					_empty: [{}]
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
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					_child1: [
						{
							attributes: {
								attr: 'val1'
							},
							_grandchild: [{ text: 'GC1' }, { text: 'GC2' }]
						}
					],
					_child2: [
						{
							_grandchild: [
								{
									attributes: {
										attr: 'val2'
									},
									text: 'GC3'
								}
							]
						}
					]
				}
			]
		});
	});

	it('should ignore comments', () => {
		const xml = '<root><!-- This is a comment -->Value</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					text: 'Value'
				}
			]
		});
	});

	it('should ignore processing instructions', () => {
		const xml = '<?xml version="1.0" encoding="UTF-8"?><root>Value</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					text: 'Value'
				}
			]
		});
	});

	it('should handle mixed content', () => {
		const xml = '<root>Text <child>Child Text</child> More Text</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					content: ['Text', { tag: 'child', text: 'Child Text' }, 'More Text']
				}
			]
		});
	});

	it('should handle multiple attributes', () => {
		const xml = '<root attr1="value1" attr2="value2">Content</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			_root: [
				{
					attributes: {
						attr1: 'value1',
						attr2: 'value2'
					},
					text: 'Content'
				}
			]
		});
	});
});
