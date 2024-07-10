import { describe, expect, it } from 'vitest';

import { formatPath } from './format-path';

describe('formatPath function', () => {
	it('should replace single curly braces with colons', () => {
		const path = '/users/{userId}/books/{bookId}';
		const formatted = formatPath(path);
		expect(formatted).toBe('/users/:userId/books/:bookId');
	});

	it('should handle paths without placeholders correctly', () => {
		const path = '/users/all';
		const formatted = formatPath(path);
		expect(formatted).toBe('/users/all');
	});
});
