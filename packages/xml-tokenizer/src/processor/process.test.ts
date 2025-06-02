import { describe, expect, it } from 'vitest';
import { htmlConfig } from '../config';
import { process } from './process';
import { TProcessor } from './types';

describe('process function', () => {
	const simpleXml = '<root><item>text</item></root>';

	it('should handle empty processors', () => {
		const result = process(simpleXml, [], htmlConfig);
		expect(result).toEqual({});
	});

	it('should process with single processor', () => {
		const counter: TProcessor<{ count: number }> = {
			context: { count: 0 },
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.count++;
				}
			}
		};

		const result = process(simpleXml, [counter], htmlConfig);
		expect(result.count).toBe(2); // root + item
	});

	it('should process with multiple processors', () => {
		const elementCounter: TProcessor<{ elements: number }> = {
			context: { elements: 0 },
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.elements++;
				}
			}
		};

		const textCounter: TProcessor<{ texts: number }> = {
			context: { texts: 0 },
			process: (token, context) => {
				if (token.type === 'Text' && token.text.trim().length > 0) {
					context.texts++;
				}
			}
		};

		const result = process(simpleXml, [elementCounter, textCounter], htmlConfig);
		expect(result.elements).toBe(2);
		expect(result.texts).toBe(1);
	});

	it('should merge contexts from all processors', () => {
		const processor1: TProcessor<{ prop1: string }> = {
			context: { prop1: 'value1' },
			process: () => {}
		};

		const processor2: TProcessor<{ prop2: string }> = {
			context: { prop2: 'value2' },
			process: () => {}
		};

		const result = process(simpleXml, [processor1, processor2], htmlConfig);
		expect(result.prop1).toBe('value1');
		expect(result.prop2).toBe('value2');
	});

	it('should allow processors to share data', () => {
		const shared: TProcessor<{ sharedValue: number }> = {
			context: { sharedValue: 0 }
		};

		const setter: TProcessor<{ setValue: number }, [typeof shared]> = {
			context: { setValue: 0 },
			deps: [shared],
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.sharedValue = 42;
					context.setValue = 42;
				}
			}
		};

		const reader: TProcessor<{ getValue: number }, [typeof shared]> = {
			context: { getValue: 0 },
			deps: [shared],
			process: (token, context) => {
				if (token.type === 'Text') {
					context.getValue = context.sharedValue;
				}
			}
		};

		const result = process(simpleXml, [shared, setter, reader], htmlConfig);
		expect(result.setValue).toBe(42);
		expect(result.getValue).toBe(42);
	});

	it('should work with correct dependency order', () => {
		const base: TProcessor<{ count: number }> = {
			context: { count: 0 },
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.count++;
				}
			}
		};

		const dependent: TProcessor<{ doubled: number }, [typeof base]> = {
			context: { doubled: 0 },
			deps: [base],
			process: (token, context) => {
				if (token.type === 'ElementEnd') {
					context.doubled = context.count * 2;
				}
			}
		};

		const result = process(simpleXml, [base, dependent], htmlConfig);
		expect(result.count).toBe(2);
		expect(result.doubled).toBe(4);
	});

	it('should throw error with wrong dependency order', () => {
		const base: TProcessor<{ count: number }> = {
			name: 'BaseCounter',
			context: { count: 0 },
			process: () => {}
		};

		const dependent: TProcessor<{ items: string[] }, [typeof base]> = {
			name: 'DependentProcessor',
			context: { items: [] },
			deps: [base],
			process: () => {}
		};

		expect(() => {
			process(simpleXml, [dependent, base], htmlConfig);
		}).toThrow('Processor dependency order invalid');
	});

	it('should handle multiple dependencies', () => {
		const counter: TProcessor<{ count: number }> = {
			context: { count: 0 },
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.count++;
				}
			}
		};

		const collector: TProcessor<{ names: string[] }> = {
			context: { names: [] },
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.names.push(token.local);
				}
			}
		};

		const combiner: TProcessor<{ summary: string }, [typeof counter, typeof collector]> = {
			context: { summary: '' },
			deps: [counter, collector],
			process: (token, context) => {
				if (
					token.type === 'ElementEnd' &&
					token.end.type === 'Close' &&
					token.end.local === 'root'
				) {
					context.summary = `${context.count} elements: ${context.names.join(', ')}`;
				}
			}
		};

		const result = process(simpleXml, [counter, collector, combiner], htmlConfig);
		expect(result.count).toBe(2);
		expect(result.names).toEqual(['root', 'item']);
		expect(result.summary).toBe('2 elements: root, item');
	});

	it('should keep references in shared context', () => {
		const sharedData = { list: ['start'] };

		const writer: TProcessor<typeof sharedData> = {
			context: sharedData,
			process: (token, context) => {
				if (token.type === 'ElementStart') {
					context.list.push('written');
				}
			}
		};

		const reader: TProcessor<{ result: string }> = {
			context: { result: '' },
			process: (token, context) => {
				if (token.type === 'Text') {
					context.result = (context as any).list.join('-');
				}
			}
		};

		const result = process(simpleXml, [writer, reader], htmlConfig);

		// Both should reference the same array
		expect(result.list).toBe(sharedData.list);
		expect(result.result).toBe('start-written-written'); // reader saw writer's changes
	});
});
