import { defineFeature, type TFeature } from 'feature-core';
import type { TState, TStateBase, TStateSetOptions } from '../types';

/**
 * Adds `undo()` to a state, stepping back through past values one at a time.
 *
 * History is seeded with the current value when `undoFeature` is installed, so
 * `undo()` is a no-op when already at the oldest recorded state. The `historyLimit`
 * caps the number of entries kept; older entries are dropped as new ones arrive.
 *
 * @param historyLimit - Maximum number of history entries to keep. Defaults to `50`.
 */
export function undoFeature<GValue>(historyLimit = 50): TUndoFeature<GValue> {
	return defineFeature<TUndoFeature<GValue>>({
		key: 'undo',
		install(state: TStateBase<GValue>) {
			const history = [state.value];

			state.listen(({ value }) => {
				if (history.length >= historyLimit) {
					history.shift();
				}

				history.push(value);
			});

			return {
				_history: history,
				undo(this: TState<GValue, [TUndoFeature<GValue>]>, options) {
					if (this._history.length <= 1) {
						return;
					}

					this._history.pop();
					const nextValue = this._history.pop();
					// Note: The length guard guarantees this pop reads a stored history entry, even when that value is undefined
					this.set(nextValue as GValue, options);
				}
			};
		}
	});
}

export type TUndoFeature<GValue> = TFeature<
	'undo',
	{
		/** Steps back to the previous value. No-op when already at the oldest recorded entry. */
		undo(options?: TStateSetOptions<GValue>): void;
		/** @internal */
		_history: GValue[];
	}
>;
