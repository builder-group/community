import { afterEach, describe, expect, it, vi } from 'vitest';
import { SplitFlapSpoolMinimal } from './SplitFlapSpoolMinimal';
import { SplitFlapSpoolRealistic } from './SplitFlapSpoolRealistic';

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

	it('retargets to the latest valid value while a spin is in progress', async () => {
		vi.useFakeTimers();

		const spool = new SplitFlapSpoolMinimal();
		const settled: string[] = [];
		spool.dispatchEvent = ((event: Event) => {
			if (event instanceof CustomEvent && event.type === 'settled') {
				settled.push(String(event.detail.value));
			}
			return true;
		}) as typeof spool.dispatchEvent;

		spool.value = 'C';
		spool.updated(new Map([['value', ' ']]));

		await vi.advanceTimersByTimeAsync(10);

		spool.value = 'A';
		spool.updated(new Map([['value', 'C']]));

		await vi.advanceTimersByTimeAsync(400);

		expect(settled).toEqual(['A']);
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

	it('continues coherently after the spool changes mid-animation', async () => {
		vi.useFakeTimers();

		const spool = new SplitFlapSpoolMinimal();
		const settled: string[] = [];
		spool.dispatchEvent = ((event: Event) => {
			if (event instanceof CustomEvent && event.type === 'settled') {
				settled.push(String(event.detail.value));
			}
			return true;
		}) as typeof spool.dispatchEvent;

		spool.flaps = [
			{ type: 'char', value: '0' },
			{ type: 'char', value: '1' },
			{ type: 'char', value: '2' },
			{ type: 'char', value: '3' }
		];
		spool.value = '3';
		spool.updated(
			new Map([
				['flaps', []],
				['value', ' ']
			])
		);

		await vi.advanceTimersByTimeAsync(10);

		const previousFlaps = spool.flaps;
		spool.flaps = [
			{ type: 'char', value: '1' },
			{ type: 'char', value: '2' },
			{ type: 'char', value: '3' },
			{ type: 'char', value: '0' }
		];
		spool.updated(new Map([['flaps', previousFlaps]]));

		await vi.advanceTimersByTimeAsync(400);

		expect(settled).toEqual(['3']);
		expect(spool.currentValue).toBe('3');
		expect(spool.isSettled).toBe(true);
	});

	it('clears pending realistic wrap resets when the spool changes', () => {
		const spool = new SplitFlapSpoolRealistic();
		const internal = spool as unknown as {
			_wrapResetTimer: ReturnType<typeof setTimeout> | null;
		};
		const previousFlaps = spool.flaps;

		internal._wrapResetTimer = setTimeout(() => undefined, 1000);
		spool.flaps = [...previousFlaps];
		spool.updated(new Map([['flaps', previousFlaps]]));

		expect(internal._wrapResetTimer).toBeNull();
	});

	it('does not suppress the next real animation after a no-op realistic spool replacement', () => {
		const spool = new SplitFlapSpoolRealistic();
		const internal = spool as unknown as {
			_skipNextIndexAnimation: boolean;
			_currentIndex: number;
			_animateStep: (prevIdx: number, nextIdx: number) => Promise<void>;
		};
		const animateStep = vi.fn(async () => undefined);
		const previousFlaps = spool.flaps;

		internal._animateStep = animateStep;
		spool.flaps = [...previousFlaps];
		spool.updated(new Map([['flaps', previousFlaps]]));

		expect(internal._skipNextIndexAnimation).toBe(false);

		internal._currentIndex = 1;
		spool.updated(new Map([['_currentIndex', 0]]));

		expect(animateStep).toHaveBeenCalledWith(0, 1);
	});
});
