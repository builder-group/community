import type { TMat3 } from './types';

export function mat3ToArray(
	mat3: TMat3
): [number, number, number, number, number, number, number, number, number] {
	return [
		mat3[0][0],
		mat3[0][1],
		mat3[0][2],
		mat3[1][0],
		mat3[1][1],
		mat3[1][2],
		mat3[2][0],
		mat3[2][1],
		mat3[2][2]
	];
}
