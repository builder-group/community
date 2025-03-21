import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { withNew } from '@blgc/utils';
import type { TState, TUndoFeature } from '../types';

export function withUndo<GValue, GFeatures extends TFeatureDefinition[]>(
	baseState: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>,
	historyLimit = 50
): TState<GValue, [TUndoFeature<GValue>, ...GFeatures]> {
	const undoFeature: TUndoFeature<GValue>['api'] = {
		_history: [baseState._v],
		undo(this: TState<GValue, [TUndoFeature<GValue>]>, options) {
			if (this._history.length > 1) {
				this._history.pop(); // Pop current value
				const newValue = this._history.pop(); // Pop previous value
				if (newValue != null) {
					this.set(newValue, options);
				}
			}
		}
	};

	// Extend the base state with the undo feature
	const extendedState = Object.assign(baseState, undoFeature) as TState<
		GValue,
		[TUndoFeature<GValue>]
	>;
	extendedState._features.push('undo');

	return withNew<TState<GValue, [TUndoFeature<GValue>]>, [number]>(
		Object.assign(extendedState, {
			_new(this: TState<GValue, [TUndoFeature<GValue>]>, historyLimit: number) {
				this.listen(
					({ value }) => {
						// Maintaining the history stack size
						if (this._history.length >= historyLimit) {
							this._history.shift(); // Remove oldest state
						}

						this._history.push(value);
					},
					{ key: 'with-undo' }
				);
			}
		}),
		historyLimit
	) as unknown as TState<GValue, [TUndoFeature<GValue>, ...GFeatures]>;
}
