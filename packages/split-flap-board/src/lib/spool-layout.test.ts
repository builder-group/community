import { describe, expect, it } from 'vitest';
import { numericSpool } from '../spools/presets';
import { getMaxVisibleSideCount, getRenderedFlaps, getSignedCircularOffset } from './spool-layout';

describe('spool layout helpers', () => {
	it('distributes indices evenly around the current flap', () => {
		expect(getSignedCircularOffset(3, 2, 11)).toBe(1);
		expect(getSignedCircularOffset(1, 2, 11)).toBe(-1);
		expect(getSignedCircularOffset(9, 2, 11)).toBe(-4);
		expect(getSignedCircularOffset(7, 2, 11)).toBe(5);
	});

	it('limits rendering to the requested number of flaps per side', () => {
		expect(
			getRenderedFlaps(numericSpool, 2, { visibleSideCount: 4 }).map((item) => item.actualIndex)
		).toEqual([8, 9, 0, 1, 2, 3, 4, 5, 6]);
	});

	it('can shift the rendered center forward for wraparound animation', () => {
		expect(getRenderedFlaps(numericSpool, 0, { visibleSideCount: 2, renderCenter: 10 })).toEqual([
			{ flap: numericSpool[8]!, actualIndex: 8, renderedIndex: 8 },
			{ flap: numericSpool[9]!, actualIndex: 9, renderedIndex: 9 },
			{ flap: numericSpool[0]!, actualIndex: 0, renderedIndex: 10 },
			{ flap: numericSpool[1]!, actualIndex: 1, renderedIndex: 11 },
			{ flap: numericSpool[2]!, actualIndex: 2, renderedIndex: 12 }
		]);
	});

	it('uses the full visible half of the drum by default', () => {
		expect(getMaxVisibleSideCount(11)).toBe(5);
		expect(getMaxVisibleSideCount(10)).toBe(5);
	});
});
