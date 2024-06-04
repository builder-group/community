import type { TEnforceFeatures, TFeatureKeys, TSelectFeatures, TState } from '../types';

export function withUndo<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base']>>,
	historyLimit = 50
): TState<GValue, ['undo', ...GSelectedFeatureKeys]> {
	state._features.push('undo');

	const undoFeature: TSelectFeatures<GValue, ['undo']> = {
		_history: [state._value],
		undo(this: TState<GValue, ['undo']>) {
			this._history.pop(); // Pop current value
			const newValue = this._history.pop(); // Pop previous value
			if (newValue != null) {
				this.set(newValue);
			}
		}
	};

	// Merge existing features from the state with the new undo feature
	const _state = Object.assign(state, undoFeature);

	_state.listen((value) => {
		// Maintaining the history stack size
		if (_state._history.length >= historyLimit) {
			_state._history.shift(); // Remove oldest state
		}

		_state._history.push(value);
	});

	return _state as TState<GValue, ['undo', ...GSelectedFeatureKeys]>;
}
