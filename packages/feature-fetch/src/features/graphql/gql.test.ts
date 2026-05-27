import { describe, expect, it } from 'vitest';
import { gql } from './gql';

describe('gql function', () => {
	it('should return template literals with interpolated values', () => {
		// Prepare
		const fieldName = 'id';

		// Act
		const result = gql`
			query Viewer {
				viewer {
					${fieldName}
				}
			}
		`;

		// Assert
		expect(result).toBe(`
			query Viewer {
				viewer {
					id
				}
			}
		`);
	});

	it('should return an empty string for empty template literals', () => {
		// Act
		const result = gql``;

		// Assert
		expect(result).toBe('');
	});

	it('should keep escape sequences raw', () => {
		// Act
		const result = gql`query Viewer { viewer(name: "Benno\nBuilder") { id } }`;

		// Assert
		expect(result).toBe('query Viewer { viewer(name: "Benno\\nBuilder") { id } }');
	});
});
