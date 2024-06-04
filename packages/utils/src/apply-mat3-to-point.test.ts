import { describe, expect, it } from 'vitest';

import { applyMat3ToPoint } from './apply-mat3-to-point';
import type { TMat3, TVec2 } from './types';

describe('applyMat3ToPoint function', () => {
	it('should correctly apply an identity matrix', () => {
		const matrix: TMat3 = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1]
		];
		const point: TVec2 = [2, 3];
		const result = applyMat3ToPoint(matrix, point);
		expect(result).toEqual([2, 3]);
	});

	it('should correctly apply a translation matrix', () => {
		const matrix: TMat3 = [
			[1, 0, 5],
			[0, 1, 10],
			[0, 0, 1]
		];
		const point: TVec2 = [2, 3];
		const result = applyMat3ToPoint(matrix, point);
		expect(result).toEqual([7, 13]);
	});

	it('should correctly apply a scaling matrix', () => {
		const matrix: TMat3 = [
			[2, 0, 0],
			[0, 3, 0],
			[0, 0, 1]
		];
		const point: TVec2 = [2, 3];
		const result = applyMat3ToPoint(matrix, point);
		expect(result).toEqual([4, 9]);
	});

	it('should correctly apply a rotation matrix (90 degrees)', () => {
		const angle = Math.PI / 2;
		const matrix: TMat3 = [
			[Math.cos(angle), -Math.sin(angle), 0],
			[Math.sin(angle), Math.cos(angle), 0],
			[0, 0, 1]
		];
		const point: TVec2 = [1, 0];
		const result = applyMat3ToPoint(matrix, point);
		expect(result[0]).toBeCloseTo(0, 5);
		expect(result[1]).toBeCloseTo(1, 5);
	});

	it('should correctly apply a combined transformation matrix', () => {
		const matrix: TMat3 = [
			[2, 0, 5],
			[0, 3, 10],
			[0, 0, 1]
		];
		const point: TVec2 = [2, 3];
		const result = applyMat3ToPoint(matrix, point);
		expect(result).toEqual([9, 19]);
	});
});
