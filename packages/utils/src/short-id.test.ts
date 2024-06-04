import { describe, expect, it } from 'vitest';

import { shortId } from './short-id';

describe('shortId function', () => {
	it('should generate a 16-character identifier by default', () => {
		const id = shortId();
		expect(id).to.have.length(16);
		expect(/^[0-9a-f]{16}$/.test(id)).toBeTruthy();
	});

	it('should generate unique identifiers on subsequent calls', () => {
		const ids = new Set();
		for (let i = 0; i < 1000; i++) {
			ids.add(shortId());
		}
		expect(ids.size).to.equal(1000);
	});

	it('should respect the provided pattern', () => {
		const pattern = 'xx-xx-xx';
		const id = shortId(pattern);
		expect(id).to.have.length(8);
		expect(/^[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}$/.test(id)).toBeTruthy();
	});
});
