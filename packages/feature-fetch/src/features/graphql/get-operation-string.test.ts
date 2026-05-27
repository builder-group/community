import { parse, type DocumentNode } from '@0no-co/graphql.web';
import { unwrapErr } from 'tuple-result';
import { describe, expect, it } from 'vitest';
import { getOperationString } from './get-operation-string';

describe('getOperationString function', () => {
	it('should return string operations unchanged', async () => {
		// Act
		const result = await getOperationString('query Viewer { viewer { id } }');

		// Assert
		expect(result.unwrap()).toBe('query Viewer { viewer { id } }');
	});

	it('should return the original source body from parsed documents', async () => {
		// Prepare
		const document = {
			loc: {
				source: {
					body: 'query Viewer { viewer { id } }'
				}
			}
		} as unknown as DocumentNode;

		// Act
		const result = await getOperationString(document);

		// Assert
		expect(result.unwrap()).toBe('query Viewer { viewer { id } }');
	});

	it('should print parsed documents without source bodies', async () => {
		// Prepare
		const document = parse('query Viewer { viewer { id } }', { noLocation: true });

		// Act
		const result = await getOperationString(document);

		// Assert
		expect(result.unwrap()).toBe(`query Viewer {
  viewer {
    id
  }
}`);
	});

	it('should map document printing failures to an error result', async () => {
		// Prepare
		const document = {
			kind: 'Document',
			definitions: [
				{
					kind: 'Unknown'
				}
			]
		} as unknown as DocumentNode;

		// Act
		const result = await getOperationString(document);

		// Assert
		expect(result.isErr()).toBe(true);
		expect(unwrapErr(result).code).toBe('#ERR_GRAPHQL_PRINT');
	});
});
