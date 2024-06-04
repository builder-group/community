import { describe, expect, it } from 'vitest';

import { ContinuousId } from './ContinuousId';

describe('ContinuousId class tests', () => {
	it('should create an instance with a specified ID', () => {
		// Prepare
		const idValue = 5;

		// Act
		const id = new ContinuousId(idValue);

		// Assert
		expect(id.toNumber()).toBe(idValue);
	});

	it('should return a ZERO instance with ID 0', () => {
		// Act
		const zeroId = ContinuousId.ZERO;

		// Assert
		expect(zeroId.toNumber()).toBe(0);
	});

	it('should generate continuous IDs starting from 0', () => {
		// Act
		const firstId = ContinuousId.nextCId();
		const secondId = ContinuousId.nextCId();

		// Assert
		expect(firstId.toNumber()).toBe(0);
		expect(secondId.toNumber()).toBe(1);
	});

	it('should maintain continuous IDs across instances', () => {
		// Prepare & Act
		const ids = Array.from({ length: 5 }, () => ContinuousId.nextCId());

		// Assert
		ids.forEach((id, index) => {
			expect(id.toNumber()).toBe(index + 2); // +2 because 0 and 1 were generated in a previous test
		});
	});

	it('should return a new ZERO instance each time', () => {
		// Act
		const zeroId1 = ContinuousId.ZERO;
		const zeroId2 = ContinuousId.ZERO;

		// Assert
		expect(zeroId1).not.toBe(zeroId2);
		expect(zeroId1.toNumber()).toBe(0);
		expect(zeroId2.toNumber()).toBe(0);
	});
});
