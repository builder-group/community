import { defineFeature, type TFeature } from 'feature-core';
import type { TState } from '../types';
import type { TUndoFeature } from './undo';

/**
 * Adds `multiUndo(count)` to a state, stepping back through multiple past values in one call.
 *
 * Requires `undoFeature` to be installed first.
 */
export function multiUndoFeature<GValue>(): TMultiUndoFeature<GValue> {
	return defineFeature<TMultiUndoFeature<GValue>>({
		key: 'multi-undo',
		requires: ['undo'],
		install(state: TState<GValue, [TUndoFeature<GValue>]>) {
			return {
				multiUndo(count) {
					for (let i = 0; i < count; i++) {
						state.undo();
					}
				}
			};
		}
	});
}

export type TMultiUndoFeature<GValue> = TFeature<
	'multi-undo',
	{
		multiUndo(count: number): void;
	},
	[TUndoFeature<GValue>]
>;
