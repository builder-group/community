import type { TFlap } from '../types';

export interface TRenderedFlap {
	flap: TFlap;
	actualIndex: number;
	renderedIndex: number;
}

export function getSignedCircularOffset(index: number, currentIndex: number, total: number): number {
	if (total <= 0) return 0;

	const forward = (index - currentIndex + total) % total;
	if (forward === 0) return 0;

	const backward = forward - total;
	return Math.abs(backward) <= Math.abs(forward) ? backward : forward;
}

export function getMaxVisibleSideCount(total: number, visibleSideCount?: number): number {
	const maxSideCount = Math.floor(total / 2);
	if (visibleSideCount == null || visibleSideCount < 0) return maxSideCount;
	return Math.min(Math.floor(visibleSideCount), maxSideCount);
}

export function getRenderedFlaps(
	flaps: TFlap[],
	currentIndex: number,
	{
		visibleSideCount,
		renderCenter = currentIndex
	}: {
		visibleSideCount?: number;
		renderCenter?: number;
	} = {}
): TRenderedFlap[] {
	const maxVisibleSideCount = getMaxVisibleSideCount(flaps.length, visibleSideCount);

	return flaps
		.map((flap, actualIndex) => {
			const offset = getSignedCircularOffset(actualIndex, currentIndex, flaps.length);
			return {
				flap,
				actualIndex,
				offset,
				renderedIndex: renderCenter + offset
			};
		})
		.filter(({ offset }) => Math.abs(offset) <= maxVisibleSideCount)
		.sort((a, b) => a.renderedIndex - b.renderedIndex)
		.map(({ flap, actualIndex, renderedIndex }) => ({
			flap,
			actualIndex,
			renderedIndex
		}));
}
