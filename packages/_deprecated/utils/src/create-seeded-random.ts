/**
 * Creates a seeded pseudo-random number generator for deterministic sequences.
 *
 * **Not cryptographically secure** - use only for testing, benchmarking,
 * simulations, or other cases requiring reproducible randomness.
 *
 * @param seed - Initial seed value for deterministic generation
 * @returns Object with methods for generating random values
 *
 * @example
 * ```typescript
 * const rng = createSeededRandom(42);
 * const value = rng.next(); // Same value every time with seed 42
 * const int = rng.nextInt(1, 10); // Random int between 1-9
 * const bool = rng.nextBool(0.7); // 70% chance of true
 * ```
 */
export function createSeededRandom(seed: number) {
	const random = function (): number {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	return {
		/** Generate random number between 0 (inclusive) and 1 (exclusive) */
		next: random,
		/** Generate random boolean with optional probability (default 0.5) */
		nextBool: (probability = 0.5) => random() < probability,
		/** Generate random integer between min (inclusive) and max (exclusive) */
		nextInt: (min: number, max: number) => Math.floor(random() * (max - min)) + min
	};
}
