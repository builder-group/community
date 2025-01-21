import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { isStateWithFeatures } from '../is-state-with-features';
import type { TMultiUndoFeature, TState, TUndoFeature } from '../types';

export function withMultiUndo<GValue, GFeatures extends TFeatureDefinition[]>(
	initialState: TEnforceFeatureConstraint<
		TState<GValue, GFeatures>,
		TState<GValue, GFeatures>,
		['undo']
	>
): TState<GValue, [TMultiUndoFeature, ...GFeatures]> {
	if (!isStateWithFeatures<GValue, [TUndoFeature<GValue>]>(initialState, ['undo'])) {
		throw Error('State must have "undo" feature to use withMultiUndo');
	}

	const multiUndoFeature: TMultiUndoFeature['api'] = {
		multiUndo(this: TState<GValue, [TUndoFeature<GValue>, TMultiUndoFeature]>, count: number) {
			for (let i = 0; i < count; i++) {
				this.undo();
			}
		}
	};

	// Merge existing features from the state with the new multiundo feature
	const extendedState = Object.assign(initialState, multiUndoFeature) as unknown as TState<
		GValue,
		[TMultiUndoFeature]
	>;
	extendedState._features.push('multiundo');

	return extendedState as unknown as TState<GValue, [TMultiUndoFeature, ...GFeatures]>;
}
