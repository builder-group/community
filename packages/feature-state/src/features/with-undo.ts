import type {
	TEnforceFeatures,
	TFeatureKeys,
	TListenerCallback,
	TSelectFeatures,
	TState
} from '../types';

export function withUndo<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	historyLimit = 50
): TState<GValue, ['undo', ...GSelectedFeatureKeys]> {
	state._features.push('undo');

	const undoFeature: TSelectFeatures<GValue, ['undo']> = {
		_history: [state._value],
		undo(this: TState<GValue, ['undo']>, options) {
			this._history.pop(); // Pop current value
			const newValue = this._history.pop(); // Pop previous value
			if (newValue != null) {
				this.set(newValue, options);
			}
		}
	};

	// Merge existing features from the state with the new undo feature
	const _state = Object.assign(state, undoFeature) as TState<
		GValue,
		['undo', ...GSelectedFeatureKeys]
	>;

	_state.listen(((value: GValue, innerState: TState<GValue, ['base', 'undo']>) => {
		// Maintaining the history stack size
		if (innerState._history.length >= historyLimit) {
			innerState._history.shift(); // Remove oldest state
		}

		innerState._history.push(value);
		// TODO: Improve types so that the below type balancing act is not necessary
	}) as unknown as TListenerCallback<GValue, ['undo', ...GSelectedFeatureKeys]>);

	return _state;
}
