import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createState } from '../../create-state';
import type { TState } from '../../types';
import {
	EListenerPriority,
	priorityQueueFeature,
	type TPriorityQueueFeature,
	type TPriorityQueueFeatureApi
} from './priority-queue';

describe('priorityQueueFeature', () => {
	describe('types', () => {
		it('should add priority listener options to listen and subscribe', () => {
			// Act
			const state = createState(0).with(priorityQueueFeature<number>());

			// Assert
			expectTypeOf(state.listen).toEqualTypeOf<TPriorityQueueFeatureApi<number>['listen']>();
			expectTypeOf(state.subscribe).toEqualTypeOf<TPriorityQueueFeatureApi<number>['subscribe']>();
			expectTypeOf(state._features).toEqualTypeOf<readonly 'priority-queue'[]>();
			expectTypeOf(state).toEqualTypeOf<TState<number, [TPriorityQueueFeature<number>]>>();
		});
	});

	describe('listen', () => {
		it('should call listeners by priority', () => {
			// Prepare
			const state = createState(0).with(priorityQueueFeature<number>());
			const calls: string[] = [];
			state.listen(
				() => {
					calls.push('late');
				},
				{ priority: EListenerPriority.LATE }
			);
			state.listen(
				() => {
					calls.push('early');
				},
				{ priority: EListenerPriority.EARLY }
			);

			// Act
			state.set(1);

			// Assert
			expect(calls).toEqual(['early', 'late']);
		});

		it('should pass set listener context to listeners', () => {
			// Prepare
			const state = createState(0).with(priorityQueueFeature<number>());
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.set(1);

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: 'stateSet',
				value: 1,
				prevValue: 0
			});
		});

		it('should preserve registration order for listeners with the same priority', () => {
			// Prepare
			const state = createState(0).with(priorityQueueFeature<number>());
			const calls: string[] = [];
			state.listen(() => {
				calls.push('first');
			});
			state.listen(() => {
				calls.push('second');
			});

			// Act
			state.set(1);

			// Assert
			expect(calls).toEqual(['first', 'second']);
		});

		it('should remove queued listener calls by callback when unbound during notification', () => {
			// Prepare
			const state = createState(0).with(priorityQueueFeature<number>());
			let unbindSecond = () => {};
			const listener = vi.fn();
			state.listen(
				() => {
					unbindSecond();
				},
				{ priority: EListenerPriority.EARLY }
			);
			unbindSecond = state.listen(listener, { priority: EListenerPriority.LATE });

			// Act
			state.set(1);

			// Assert
			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('notify', () => {
		it('should pass custom listener context to listeners', () => {
			// Prepare
			const state = createState(10).with(priorityQueueFeature<number>());
			const listener = vi.fn();
			state.listen(listener);

			// Act
			state.notify({ listenerContext: { source: 'manual' }, prevValue: 5 });

			// Assert
			expect(listener).toHaveBeenCalledWith({
				source: 'manual',
				value: 10,
				prevValue: 5
			});
		});
	});

	describe('subscribe', () => {
		it('should call listeners immediately with the current value', () => {
			// Prepare
			const state = createState(10).with(priorityQueueFeature<number>());
			const listener = vi.fn();

			// Act
			state.subscribe(listener, { priority: EListenerPriority.EARLY });

			// Assert
			expect(listener).toHaveBeenCalledWith({ value: 10, prevValue: 10 });
		});
	});
});
