import { TFeatureDefinition } from '@blgc/types/features';
import { TState } from './types';

// Overload for empty array
export function applyFeatures<GValue, GInitialFeatures extends TFeatureDefinition[]>(
	initialState: TState<GValue, GInitialFeatures>,
	features: []
): TState<GValue, GInitialFeatures>;

// Overload for single feature
export function applyFeatures<
	GValue,
	GInitialFeatures extends TFeatureDefinition[],
	GF0 extends TFeatureDefinition
>(
	initialState: TState<GValue, GInitialFeatures>,
	features: [
		(state: TState<GValue, GInitialFeatures>) => TState<GValue, [GF0, ...GInitialFeatures]>
	]
): TState<GValue, [GF0, ...GInitialFeatures]>;

// Overload for two features
export function applyFeatures<
	GValue,
	GInitialFeatures extends TFeatureDefinition[],
	GF0 extends TFeatureDefinition,
	GF1 extends TFeatureDefinition
>(
	initialState: TState<GValue, GInitialFeatures>,
	features: [
		(state: TState<GValue, GInitialFeatures>) => TState<GValue, [GF0, ...GInitialFeatures]>,
		(
			state: TState<GValue, [GF0, ...GInitialFeatures]>
		) => TState<GValue, [GF1, GF0, ...GInitialFeatures]>
	]
): TState<GValue, [GF1, GF0, ...GInitialFeatures]>;

// Overload for three features
export function applyFeatures<
	GValue,
	GInitialFeatures extends TFeatureDefinition[],
	GF0 extends TFeatureDefinition,
	GF1 extends TFeatureDefinition,
	GF2 extends TFeatureDefinition
>(
	initialState: TState<GValue, GInitialFeatures>,
	features: [
		(state: TState<GValue, GInitialFeatures>) => TState<GValue, [GF0, ...GInitialFeatures]>,
		(
			state: TState<GValue, [GF0, ...GInitialFeatures]>
		) => TState<GValue, [GF1, GF0, ...GInitialFeatures]>,
		(
			state: TState<GValue, [GF1, GF0, ...GInitialFeatures]>
		) => TState<GValue, [GF2, GF1, GF0, ...GInitialFeatures]>
	]
): TState<GValue, [GF2, GF1, GF0, ...GInitialFeatures]>;

// Implementation
export function applyFeatures<GValue, GInitialFeatures extends TFeatureDefinition[]>(
	initialState: TState<GValue, GInitialFeatures>,
	features: ((state: any) => any)[]
): any {
	return features.reduce((state, feature) => feature(state), initialState);
}
