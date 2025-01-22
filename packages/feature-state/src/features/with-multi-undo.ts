import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { isStateWithFeatures } from '../is-state-with-features';
import type { TMultiUndoFeature, TState, TUndoFeature } from '../types';

export function withMultiUndo<GValue, GFeatures extends TFeatureDefinition[]>(
	baseState: TEnforceFeatureConstraint<
		TState<GValue, GFeatures>,
		TState<GValue, GFeatures>,
		['undo']
	>
): TState<GValue, [TMultiUndoFeature, ...GFeatures]> {
	if (!isStateWithFeatures<GValue, [TUndoFeature<GValue>]>(baseState, ['undo'])) {
		throw Error('State must have "undo" feature to use withMultiUndo');
	}

	const multiUndoFeature: TMultiUndoFeature['api'] = {
		multiUndo(this: TState<GValue, [TUndoFeature<GValue>, TMultiUndoFeature]>, count: number) {
			for (let i = 0; i < count; i++) {
				this.undo();
			}
		}
	};

	// Extend the base state with the multiundo feature
	const extendedState = Object.assign(baseState, multiUndoFeature) as TState<
		GValue,
		[TMultiUndoFeature]
	>;
	extendedState._features.push('multiundo');

	return extendedState as unknown as TState<GValue, [TMultiUndoFeature, ...GFeatures]>;
}
