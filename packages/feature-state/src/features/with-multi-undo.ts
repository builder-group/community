import { hasFeatures } from '../has-features';
import type { TEnforceFeatures, TFeatureKeys, TSelectFeatures, TState } from '../types';

export function withMultiUndo<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]>(
	state: TState<GValue, TEnforceFeatures<GSelectedFeatureKeys, ['base', 'undo']>>
): TState<GValue, ['multiundo', ...GSelectedFeatureKeys]> {
	if (hasFeatures(state, ['undo'])) {
		state._features.push('multiundo');

		const multiUndoFeature: TSelectFeatures<GValue, ['multiundo']> = {
			multiundo(this: TState<GValue, ['multiundo', 'undo']>, count: number) {
				for (let i = 0; i < count; i++) {
					this.undo();
				}
			}
		};

		// Merge existing features from the state with the new multiundo feature
		const _state = Object.assign(state, multiUndoFeature);

		return _state as TState<GValue, ['multiundo', ...GSelectedFeatureKeys]>;
	}

	throw Error('State must have "undo" feature to use withMultiUndo');
}
