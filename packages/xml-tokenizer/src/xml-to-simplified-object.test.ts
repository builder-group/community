import { describe, expect, it } from 'vitest';

import { xmlToSimplifiedObject } from './xml-to-simplified-object';

describe('xmlToObject function', () => {
	it('should parse a simple XML element', () => {
		const xml = '<root>Hello</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_text: 'Hello'
			}
		});
	});

	it('should parse nested elements', () => {
		const xml = '<root><child>Value</child></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				child: {
					_text: 'Value'
				}
			}
		});
	});

	it('should handle attributes', () => {
		const xml = '<root attr="value">Content</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_attributes: {
					attr: 'value'
				},
				_text: 'Content'
			}
		});
	});

	it('should handle multiple children with the same name', () => {
		const xml = '<root><child>One</child><child>Two</child></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				child: [{ _text: 'One' }, { _text: 'Two' }]
			}
		});
	});

	it('should handle namespaces', () => {
		const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>Value</ns:child></ns:root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			'ns:root': {
				'_attributes': {
					'xmlns:ns': 'http://example.com'
				},
				'ns:child': {
					_text: 'Value'
				}
			}
		});
	});

	it('should handle CDATA sections', () => {
		const xml = '<root><![CDATA[<special> characters & such]]></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_text: '<special> characters & such'
			}
		});
	});

	it('should handle empty elements', () => {
		const xml = '<root><empty/></root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				empty: {}
			}
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
			root: {
				child1: {
					_attributes: {
						attr: 'val1'
					},
					grandchild: [
						{
							_text: 'GC1'
						},
						{ _text: 'GC2' }
					]
				},
				child2: {
					grandchild: {
						_attributes: {
							attr: 'val2'
						},
						_text: 'GC3'
					}
				}
			}
		});
	});

	it('should ignore comments', () => {
		const xml = '<root><!-- This is a comment -->Value</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_text: 'Value'
			}
		});
	});

	it('should ignore processing instructions', () => {
		const xml = '<?xml version="1.0" encoding="UTF-8"?><root>Value</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_text: 'Value'
			}
		});
	});

	it('should handle mixed content', () => {
		const xml = '<root>Text <child>Child Text</child> More Text</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_content: ['Text', { _tag: 'child', _text: 'Child Text' }, 'More Text']
			}
		});
	});

	it('should handle multiple attributes', () => {
		const xml = '<root attr1="value1" attr2="value2">Content</root>';
		const result = xmlToSimplifiedObject(xml);
		expect(result).toEqual({
			root: {
				_attributes: {
					attr1: 'value1',
					attr2: 'value2'
				},
				_text: 'Content'
			}
		});
	});
});
