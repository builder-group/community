import { describe, expect, it } from 'vitest';
import { htmlConfig } from '../../config';
import { process } from '../process';
import { TProcessor } from '../types';
import { pathTracker } from './path-tracker';

describe('pathTracker processor', () => {
	const simpleXml = `<article><header><h1>Title</h1></header></article>`;

	it('should track path correctly', () => {
		const result = process(simpleXml, [pathTracker], htmlConfig);

		// After processing, should be back to empty path
		expect(result.currentPath).toBe('');
		expect(result.currentPathArray).toEqual([]);
	});

	it('should work with dependent processor that uses path', () => {
		// Processor that depends on pathTracker and collects paths
		const pathCollector: TProcessor<{ visitedPaths: string[] }, [typeof pathTracker]> = {
			name: 'PathCollector',
			context: { visitedPaths: [] },
			deps: [pathTracker],
			process: (token, context) => {
				if (token.type === 'ElementStart' && context.currentPath) {
					context.visitedPaths.push(context.currentPath);
				}
			}
		};

		const result = process(simpleXml, [pathTracker, pathCollector], htmlConfig);

		expect(result.visitedPaths).toEqual(['article', 'article/header', 'article/header/h1']);
	});
});
