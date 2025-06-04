import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './create-seeded-random';

describe('createSeededRandom', () => {
	it('should generate deterministic sequences with same seed', () => {
		const rng1 = createSeededRandom(42);
		const rng2 = createSeededRandom(42);

		for (let i = 0; i < 100; i++) {
			expect(rng1.next()).toBe(rng2.next());
		}
	});

	it('should generate different sequences with different seeds', () => {
		const rng1 = createSeededRandom(42);
		const rng2 = createSeededRandom(123);

		expect(rng1.next()).not.toBe(rng2.next());
	});

	it('should generate numbers between 0 and 1', () => {
		const rng = createSeededRandom(42);
		for (let i = 0; i < 100; i++) {
			const value = rng.next();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it('should generate boolean values with nextBool', () => {
		const rng = createSeededRandom(42);
		const value = rng.nextBool();
		expect(typeof value).toBe('boolean');
	});

	it('should respect probability in nextBool', () => {
		const rng = createSeededRandom(42);
		const alwaysTrue = rng.nextBool(1);
		const alwaysFalse = rng.nextBool(0);
		expect(alwaysTrue).toBe(true);
		expect(alwaysFalse).toBe(false);
	});

	it('should generate integers within range with nextInt', () => {
		const rng = createSeededRandom(42);
		for (let i = 0; i < 100; i++) {
			const value = rng.nextInt(5, 15);
			expect(value).toBeGreaterThanOrEqual(5);
			expect(value).toBeLessThan(15);
			expect(Number.isInteger(value)).toBe(true);
		}
	});
});
