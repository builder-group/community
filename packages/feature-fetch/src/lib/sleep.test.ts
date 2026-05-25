import { describe, expect, it, vi } from 'vitest';
import { sleep } from './sleep';

describe('sleep function', () => {
	it('should resolve after the delay', async () => {
		// Prepare
		vi.useFakeTimers();
		try {
			const onResolve = vi.fn();

			// Act
			const sleepPromise = sleep(1000).then(onResolve);
			await vi.advanceTimersByTimeAsync(999);

			// Assert
			expect(onResolve).not.toHaveBeenCalled();

			// Act
			await vi.advanceTimersByTimeAsync(1);
			await sleepPromise;

			// Assert
			expect(onResolve).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it('should resolve immediately for non-positive delays', async () => {
		await expect(sleep(0)).resolves.toBeUndefined();
		await expect(sleep(-1)).resolves.toBeUndefined();
	});

	it('should reject when the signal is already aborted', async () => {
		// Prepare
		const controller = new AbortController();
		const reason = new Error('Cancelled');
		controller.abort(reason);

		// Act / Assert
		await expect(sleep(1000, controller.signal)).rejects.toBe(reason);
	});

	it('should stop waiting when the signal aborts', async () => {
		// Prepare
		vi.useFakeTimers();
		try {
			const controller = new AbortController();
			const reason = new Error('Cancelled');

			// Act
			const sleepPromise = sleep(1000, controller.signal);
			await vi.advanceTimersByTimeAsync(100);
			controller.abort(reason);

			// Assert
			await expect(sleepPromise).rejects.toBe(reason);
		} finally {
			vi.useRealTimers();
		}
	});
});
