import { afterEach, describe, expect, it, vi } from 'vitest';
import { SplitFlapSpoolMinimal } from './SplitFlapSpoolMinimal';

describe('SplitFlapSpoolBase behavior', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders an empty spool without throwing', () => {
		const spool = new SplitFlapSpoolMinimal();
		spool.flaps = [];

		expect(() => spool.render()).not.toThrow();
	});

	it('reports the actual landed flap when an invalid value interrupts a spin', async () => {
		vi.useFakeTimers();

		const spool = new SplitFlapSpoolMinimal();
		const settled: string[] = [];
		spool.dispatchEvent = ((event: Event) => {
			if (event instanceof CustomEvent && event.type === 'settled') {
				settled.push(String(event.detail.value));
			}
			return true;
		}) as typeof spool.dispatchEvent;

		spool.value = 'B';
		spool.updated(new Map([['value', ' ']]));

		await vi.advanceTimersByTimeAsync(10);

		spool.value = '?';
		spool.updated(new Map([['value', 'B']]));

		await vi.advanceTimersByTimeAsync(200);

		expect(settled).toHaveLength(1);
		expect(settled[0]).toBe(spool.currentValue);
		expect(spool.currentValue).toBe('A');
		expect(spool.isSettled).toBe(true);
	});

	it('remaps the current flap by key when the spool changes', () => {
		const spool = new SplitFlapSpoolMinimal();
		const internal = spool as unknown as {
			_clearTimers(): void;
			_currentIndex: number;
			_prevIndex: number;
			_stepping: boolean;
		};

		spool.value = 'A';
		spool.updated(new Map([['value', ' ']]));
		internal._clearTimers();
		internal._currentIndex = 1;
		internal._prevIndex = 0;
		internal._stepping = false;
		const previousFlaps = spool.flaps;

		spool.flaps = [
			{ type: 'char', value: '0' },
			{ type: 'char', value: 'A' },
			{ type: 'char', value: '1' }
		];
		spool.updated(new Map([['flaps', previousFlaps]]));

		expect(spool.currentValue).toBe('A');
		expect(spool.isSettled).toBe(true);
	});
});
