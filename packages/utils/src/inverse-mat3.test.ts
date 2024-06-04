import { describe, expect, it } from 'vitest';

import { inverseMat3 } from './inverse-mat3';
import type { TMat3 } from './types';

// Tests were validated using https://matrix.reshish.com/de/inverCalculation.php

describe('inverseMat3 function', () => {
	it('should return the correct inverse for a non-singular matrix', () => {
		const mat: TMat3 = [
			[1, 2, 3],
			[0, 1, 4],
			[5, 6, 0]
		];

		const expectedInverse: TMat3 = [
			[-24, 18, 5],
			[20, -15, -4],
			[-5, 4, 1]
		];

		const result = inverseMat3(mat);

		expect(result).not.toBeNull();
		if (result !== null) {
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					// @ts-expect-error -- Mat3
					expect(result[i][j]).toBeCloseTo(expectedInverse[i][j], 5);
				}
			}
		}
	});

	it('should return null for a singular matrix', () => {
		const mat: TMat3 = [
			[1, 2, 3],
			[4, 5, 6],
			[7, 8, 9]
		];

		const result = inverseMat3(mat);
		expect(result).toBeNull();
	});

	it('should handle the identity matrix correctly', () => {
		const mat: TMat3 = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];

		const expectedInverse: TMat3 = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];

		const result = inverseMat3(mat);

		expect(result).not.toBeNull();
		if (result !== null) {
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					// @ts-expect-error -- Mat3
					expect(result[i][j]).toBeCloseTo(expectedInverse[i][j], 5);
				}
			}
		}
	});

	it('should return the correct inverse for another non-singular matrix', () => {
		const mat: TMat3 = [
			[2, -1, 0],
			[-1, 2, -1],
			[0, -1, 2]
		];

		const expectedInverse: TMat3 = [
			[3 / 4, 1 / 2, 1 / 4],
			[1 / 2, 1, 1 / 2],
			[1 / 4, 1 / 2, 3 / 4]
		];

		const result = inverseMat3(mat);

		expect(result).not.toBeNull();
		if (result !== null) {
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					// @ts-expect-error -- Mat3
					expect(result[i][j]).toBeCloseTo(expectedInverse[i][j], 5);
				}
			}
		}
	});
});
