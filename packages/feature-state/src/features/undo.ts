import { defineFeature, type TFeature } from 'feature-core';
import type { TStateBase, TStateSetOptions } from '../types';

/**
 * Adds `undo()` to a state, stepping back through past values one at a time.
 *
 * History is seeded with the current value when `undoFeature` is installed, so
 * `undo()` is a no-op when already at the oldest recorded state. The `historyLimit`
 * caps the number of entries kept; older entries are dropped as new ones arrive.
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
				undo(options) {
					if (history.length <= 1) {
						return;
					}

					history.pop();
					const nextValue = history.pop();
					if (nextValue != null) {
						state.set(nextValue, options);
					}
				}
			};
		}
	});
}

export type TUndoFeature<GValue> = TFeature<
	'undo',
	{
		undo(options?: TStateSetOptions<GValue>): void;
		/** @internal */
		_history: GValue[];
	}
>;
