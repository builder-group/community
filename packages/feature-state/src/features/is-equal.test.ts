import { describe, expect, it, vi } from 'vitest';
import { createState, setSourceKey } from '../create-state';
import { isEqualFeature } from './is-equal';

describe('isEqualFeature function', () => {
	it('should skip updates when custom equality says values are equal', () => {
		// Prepare
		const initialValue = { status: 'valid' };
		const state = createState(initialValue).with(
			isEqualFeature<typeof initialValue>(
				(prevValue, nextValue) => prevValue.status === nextValue.status
			)
		);
		const listener = vi.fn();
		state.listen(listener);

		// Act
		state.set({ status: 'valid' });
		state.set({ status: 'invalid' });

		// Assert
		expect(state.get()).toEqual({ status: 'invalid' });
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith({
			source: setSourceKey,
			value: { status: 'invalid' },
			prevValue: initialValue
		});
	});

	it('should preserve set updater and listener context behavior', () => {
		// Prepare
		const state = createState(10).with(
			isEqualFeature<number>((prevValue, nextValue) => prevValue === nextValue)
		);
		const listener = vi.fn();
		state.listen(listener);

		// Act
		state.set((value) => value + 10, {
			listenerContext: {
				source: 'customSet'
			}
		});

		// Assert
		expect(state.get()).toBe(20);
		expect(listener).toHaveBeenCalledWith({
			source: 'customSet',
			value: 20,
			prevValue: 10
		});
	});

	it('should expose the configured equality function on the installed state', () => {
		// Prepare
		const isEqual = (prevValue: number, nextValue: number) => prevValue === nextValue;

		// Act
		const state = createState(0).with(isEqualFeature(isEqual));

		// Assert
		expect(state._isEqual).toBe(isEqual);
	});
});
