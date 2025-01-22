import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
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

	extendedState.listen(
		({ value }) => {
			// Maintaining the history stack size
			if (extendedState._history.length >= historyLimit) {
				extendedState._history.shift(); // Remove oldest state
			}

			extendedState._history.push(value);
		},
		{ key: 'with-undo' }
	);

	return extendedState as unknown as TState<GValue, [TUndoFeature<GValue>, ...GFeatures]>;
}
