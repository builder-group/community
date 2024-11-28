import { describe, expect, it } from 'vitest';
import { fromHex } from './from-hex';

describe('fromHex function', () => {
	it('should correctly convert a hex string to Uint8Array', () => {
		const hex = '0AFF0310';
		const byteArray = fromHex(hex);
		expect(byteArray).toEqual(new Uint8Array([10, 255, 3, 16]));
	});

	it('should throw an error for hex strings of odd length', () => {
		const byteArray = fromHex('0AF');
		expect(byteArray).toBeNull();
	});

	it('should return an empty Uint8Array for an empty hex string', () => {
		const byteArray = fromHex('');
		expect(byteArray).toEqual(new Uint8Array([]));
	});
});
