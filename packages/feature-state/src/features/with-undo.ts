import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import type { TState, TUndoFeature } from '../types';

export function withUndo<GValue, GFeatures extends TFeatureDefinition[]>(
	initialState: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>,
	historyLimit = 50
): TState<GValue, [TUndoFeature<GValue>, ...GFeatures]> {
	const undoFeature: TUndoFeature<GValue>['api'] = {
		_history: [initialState._v],
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

	// Merge existing features from the state with the new undo feature
	const extendedState = Object.assign(initialState, undoFeature) as unknown as TState<
		GValue,
		[TUndoFeature<GValue>]
	>;
	extendedState._features.push('undo');

	extendedState.listen(
		({ state }) => {
			// Maintaining the history stack size
			if (state._history.length >= historyLimit) {
				state._history.shift(); // Remove oldest state
			}

			state._history.push(state._v);
		},
		{ key: 'with-undo' }
	);

	return extendedState as unknown as TState<GValue, [TUndoFeature<GValue>, ...GFeatures]>;
}
