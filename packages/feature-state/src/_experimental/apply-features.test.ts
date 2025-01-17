import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { describe, it } from 'vitest';
import { createState } from '../create-state';
import { TStorageInterface } from '../features';
import { TMultiUndoFeature, TPersistFeature, TState, TUndoFeature } from '../types';
import { applyFeatures } from './apply-features';

describe('applyFeatures function', () => {
	it('should have correct types', () => {
		const state1 = applyFeatures(createState(0), withUndo(), withMultiUndo());
		const state2 = applyFeatures(createState(0), withUndo());
		const state3 = applyFeatures(
			createState(0),
			withUndo(),
			withMultiUndo(),
			withStorage(null as any, 'test')
		);
		const state4 = withMultiUndo()(withUndo()(createState(0)));
	});
});

export function withMultiUndo() {
	return <GValue, GFeatures extends TFeatureDefinition[]>(
		state: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, ['undo']>
	): TState<GValue, [TMultiUndoFeature, ...GFeatures]> => {
		return null as any;
	};
}

export function withStorage<GStorageValue>(storage: TStorageInterface<GStorageValue>, key: string) {
	return <GValue, GFeatures extends TFeatureDefinition[]>(
		state: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>
	): TState<GValue, [TPersistFeature, ...GFeatures]> => {
		return null as any;
	};
}

export function withUndo(historyLimit = 50) {
	return <GValue, GFeatures extends TFeatureDefinition[]>(
		state: TEnforceFeatureConstraint<TState<GValue, GFeatures>, TState<GValue, GFeatures>, []>
	): TState<GValue, [TUndoFeature<GValue>, ...GFeatures]> => {
		return null as any;
	};
}
