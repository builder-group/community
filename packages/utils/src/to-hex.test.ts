import { describe, expect, it } from 'vitest';

import { toHex } from './to-hex';

describe('toHex function', () => {
	it('should correctly convert Uint8Array to hex string', () => {
		const buffer = new Uint8Array([10, 255, 3, 16]);
		const hex = toHex(buffer);
		expect(hex).toBe('0AFF0310');
	});

	it('should return an empty string for an empty buffer', () => {
		const buffer = new Uint8Array([]);
		const hex = toHex(buffer);
		expect(hex).toBe('');
	});
});
