import { applyMat3ToPoint } from './apply-mat3-to-point';
import { inverseMat3 } from './inverse-mat3';
import { multiplyVec2 } from './multiply-vec2';
import type { TMat3, TVec2 } from './types';

// Inspired by: https://github.com/figma-plugin-helper-functions/figma-plugin-helpers/blob/master/src/helpers/extractLinearGradientStartEnd.ts
export function extractStartEndPointFromMat3(size: TVec2, mat3: TMat3): [TVec2, TVec2] | null {
	const mat3Inv = inverseMat3(mat3);
	if (mat3Inv === null) {
		return null;
	}

	const startEndPoint: [TVec2, TVec2] = [
		[0.0, 0.5],
		[1.0, 0.5]
	];

	const transformedStartEndPoint = startEndPoint.map(
		(point) => applyMat3ToPoint(mat3Inv, point) as TVec2
	) as [TVec2, TVec2];

	return [
		multiplyVec2(transformedStartEndPoint[0], size),
		multiplyVec2(transformedStartEndPoint[1], size)
	];
}
