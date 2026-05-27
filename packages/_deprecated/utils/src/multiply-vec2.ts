import type { TVec2 } from './types';

export function multiplyVec2(vec1: TVec2, vec2: TVec2): TVec2 {
	return [vec1[0] * vec2[0], vec1[1] * vec2[1]];
}
