import { hasFeatures } from '../has-features';
import type { TEnforceFeatures, TFeatureKeys, TSelectFeatures, TState } from '../types';

export function withMultiUndo<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base', 'undo']>>
): TState<GValue, ['multiundo', ...GSelectedFeatureKeys]> {
	if (hasFeatures(state, ['undo'])) {
		const multiUndoFeature: TSelectFeatures<GValue, ['multiundo']> = {
			multiUndo(this: TState<GValue, ['multiundo', 'undo']>, count: number) {
				for (let i = 0; i < count; i++) {
					this.undo();
				}
			}
		};

		// Merge existing features from the state with the new multiundo feature
		const _state = Object.assign(state, multiUndoFeature) as TState<
			GValue,
			['multiundo', ...GSelectedFeatureKeys]
		>;
		_state._features.push('multiundo');

		return _state;
	}

	throw Error('State must have "undo" feature to use withMultiUndo');
}
