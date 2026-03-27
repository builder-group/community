import type { TFlap } from '../types';

/** One flap instance prepared for rendering around the realistic drum. */
export interface TRenderedFlap {
	flap: TFlap;
	actualIndex: number;
	renderedIndex: number;
}

/** Returns the shortest signed distance between two indices on a circular spool. */
export function getSignedCircularOffset(
	index: number,
	currentIndex: number,
	total: number
): number {
	if (total <= 0) return 0;

	const forward = (index - currentIndex + total) % total;
	if (forward === 0) return 0;

	const backward = forward - total;
	return Math.abs(backward) <= Math.abs(forward) ? backward : forward;
}

/** Clamps visible side count to the maximum non-overlapping half of the drum. */
export function getMaxVisibleSideCount(total: number, visibleSideCount?: number): number {
	const maxSideCount = Math.floor(total / 2);
	if (visibleSideCount == null || visibleSideCount < 0) return maxSideCount;
	return Math.min(Math.floor(visibleSideCount), maxSideCount);
}

/** Returns the subset of flaps that should be rendered around the current center. */
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
