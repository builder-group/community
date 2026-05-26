import { describe, expect, it } from 'vitest';
import { formatOpenApiPath } from './format-path';

describe('formatOpenApiPath function', () => {
	it('should convert OpenAPI placeholders to router params', () => {
		const path = '/users/{userId}/books/{bookId}';
		const formatted = formatOpenApiPath(path);
		expect(formatted).toBe('/users/:userId/books/:bookId');
	});

	it('should leave paths without placeholders unchanged', () => {
		const path = '/users/all';
		const formatted = formatOpenApiPath(path);
		expect(formatted).toBe('/users/all');
	});
});
