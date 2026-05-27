import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createState } from '../create-state';
import type { TState } from '../types';
import {
	asyncQueueFeature,
	type TAsyncQueueFeature,
	type TAsyncQueueFeatureApi
} from './async-queue';

describe('asyncQueueFeature function', () => {
	describe('types', () => {
		it('should make notify return the async queue flush promise', () => {
			// Act
			const state = createState(0).with(asyncQueueFeature<number>());

			// Assert
			expectTypeOf(state.notify).toEqualTypeOf<TAsyncQueueFeatureApi<number>['notify']>();
			expectTypeOf(state._features).toEqualTypeOf<readonly 'async-queue'[]>();
			expectTypeOf(state).toEqualTypeOf<TState<number, [TAsyncQueueFeature<number>]>>();
		});
	});

	describe('notify method', () => {
		it('should defer listener calls', async () => {
			// Prepare
			const state = createState(0).with(asyncQueueFeature<number>());
			const listener = vi.fn();
			state.listen(listener);

			// Act
			const processPromise = state.notify({ prevValue: 0 });

			// Assert
			expect(listener).not.toHaveBeenCalled();

			// Act
			await processPromise;

			// Assert
			expect(listener).toHaveBeenCalledWith({ value: 0, prevValue: 0 });
		});

		it('should process listeners in registration order', async () => {
			// Prepare
			const state = createState(0).with(asyncQueueFeature<number>());
			const calls: string[] = [];
			state.listen(async () => {
				await Promise.resolve();
				calls.push('first');
			});
			state.listen(() => {
				calls.push('second');
			});

			// Act
			await state.notify();

			// Assert
			expect(calls).toEqual(['first', 'second']);
		});

		it('should reuse the active queue flush promise', async () => {
			// Prepare
			const state = createState(0).with(asyncQueueFeature<number>());
			const deferred = createDeferred();
			const calls: string[] = [];
			state.listen(async () => {
				await deferred.promise;
				calls.push('first');
			});

			// Act
			const firstPromise = state.notify();
			const secondPromise = state.notify({ listenerContext: { source: 'second' } });

			// Assert
			expect(secondPromise).toBe(firstPromise);
			expect(calls).toEqual([]);

			// Act
			deferred.resolve();
			await secondPromise;

			// Assert
			expect(calls).toEqual(['first', 'first']);
		});

		it('should remove queued listener calls by callback when unbound before flushing', async () => {
			// Prepare
			const state = createState(0).with(asyncQueueFeature<number>());
			const listener = vi.fn();
			const unbind = state.listen(listener);

			// Act
			const processPromise = state.notify();
			unbind();
			await processPromise;

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});

		it('should pass set listener context to listeners', async () => {
			// Prepare
			const state = createState(0).with(asyncQueueFeature<number>());
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.set(1);
			await Promise.resolve();

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: 'stateSet',
				value: 1,
				prevValue: 0
			});
		});
	});

	describe('subscribe method', () => {
		it('should call listeners immediately with the current value', () => {
			// Prepare
			const state = createState(10).with(asyncQueueFeature<number>());
			const listener = vi.fn();

			// Act
			state.subscribe(listener);

			// Assert
			expect(listener).toHaveBeenCalledWith({ value: 10, prevValue: 10 });
		});
	});
});

function createDeferred(): TDeferred {
	let resolvePromise: (() => void) | null = null;
	const promise = new Promise<void>((resolve) => {
		resolvePromise = resolve;
	});

	if (resolvePromise == null) {
		throw new Error('Deferred promise resolver was not initialized.');
	}

	return {
		promise,
		resolve: resolvePromise
	};
}

interface TDeferred {
	promise: Promise<void>;
	resolve(): void;
}
