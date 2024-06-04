import { describe, expect, it } from 'vitest';

import { sleep } from './sleep';

describe('sleep function', () => {
	it('should resolve after the specified duration', async () => {
		const start = Date.now();
		await sleep(100);
		const end = Date.now();

		// Checking if the difference in time is close to 100ms.
		// There may be minor differences, so we can't always expect exactly 100ms
		// but we can reasonably expect it to be within a few milliseconds of the target.
		expect(end - start).to.be.closeTo(100, 10);
	});
});
