import type { TMat3, TVec2 } from './types';

export function applyMat3ToPoint(matrix: TMat3, point: TVec2): TVec2 {
	return [
		point[0] * matrix[0][0] + point[1] * matrix[0][1] + matrix[0][2],
		point[0] * matrix[1][0] + point[1] * matrix[1][1] + matrix[1][2]
	];
}
