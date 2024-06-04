import type { TMat3 } from './types';

export function arrayToMat3(array: number[]): TMat3 | null {
	if (array.length === 9) {
		return [
			// @ts-expect-error -- Covered by above length check
			[array[0], array[1], array[2]],
			// @ts-expect-error -- Covered by above length check
			[array[3], array[4], array[5]],
			// @ts-expect-error -- Covered by above length check
			[array[6], array[7], array[8]]
		];
	}
	return null;
}
