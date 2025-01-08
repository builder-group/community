import { TFeatureDefinition } from '@blgc/types/features';
import { TState } from './types';

// We tried two approaches with array parameters that didn't work due to TypeScript limitations:
//
// 1. Using array of feature functions with return type constraint:
//    function applyFeatures<
//      GValue,
//      GInitialFeatures extends TFeatureDefinition[],
//      GF0 extends TFeatureDefinition,
//      GF1 extends TFeatureDefinition
//    >(
//      initialState: TState<GValue, GInitialFeatures>,
//      [(state: TState<GValue, GInitialFeatures>) => GF0,
//       (state: TState<GValue, [GF0, ...GInitialFeatures]>) => GF1]
//    ): TState<GValue, [GF1, GF0, ...GInitialFeatures]>
//    Issue: Generic type inference fails (see: https://stackoverflow.com/q/54955340)
//    Example: TUndoFeature<GValue> becomes TUndoFeature<unknown>
//    When we tried working around this by using TState<GValue, [any, ...GInitialFeatures]>,
//    it fixed type inference issue, but at the cost of type safety at a different place:
//    TypeScript could no longer detect missing feature dependencies.
//    Thus e.g. applying withMultiUndo without its required withUndo feature was possible.
//
// 2. Using function type constraints:
//    function applyFeatures<
//      GValue,
//      GInitialFeatures extends TFeatureDefinition[],
//      GF0 extends (state: TState<GValue, GInitialFeatures>) => TFeatureDefinition,
//      GF1 extends (state: TState<GValue, [ReturnType<GF0>, ...GInitialFeatures]>) => TFeatureDefinition
//    >(
//      initialState: TState<GValue, GInitialFeatures>,
//      [GF0, GF1]
//    ): TState<GValue, [ReturnType<GF1>, ReturnType<GF0>, ...GInitialFeatures]>
//    Issue: ReturnType<GF0> loses generic type information (see: https://stackoverflow.com/q/64948037)
//    Example: TUndoFeature<GValue> becomes TUndoFeature<unknown>
//
// Current working solution uses separate function parameters to preserve type inference:
//    function applyFeatures<GValue, ...>(
//      initialState: TState<GValue, GInitialFeatures>,
//      f1: (state: TState<GValue, GInitialFeatures>) => GF0,
//      f2: (state: TState<GValue, [GF0, ...GInitialFeatures]>) => GF1
//    ): TState<GValue, [GF1, GF0, ...GInitialFeatures]>

// Overload for one feature
export function applyFeatures<
	GValue,
	GInitialFeatures extends TFeatureDefinition[],
	GF0 extends TFeatureDefinition
>(
	initialState: TState<GValue, GInitialFeatures>,
	f1: (state: TState<GValue, GInitialFeatures>) => TState<GValue, [GF0, ...GInitialFeatures]>
): TState<GValue, [GF0, ...GInitialFeatures]>;

// Overload for two features
export function applyFeatures<
	GValue,
	GInitialFeatures extends TFeatureDefinition[],
	GF0 extends TFeatureDefinition,
	GF1 extends TFeatureDefinition
>(
	initialState: TState<GValue, GInitialFeatures>,
	f1: (state: TState<GValue, GInitialFeatures>) => TState<GValue, [GF0, ...GInitialFeatures]>,
	f2: (
		state: TState<GValue, [GF0, ...GInitialFeatures]>
	) => TState<GValue, [GF1, GF0, ...GInitialFeatures]>
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
	f1: (state: TState<GValue, GInitialFeatures>) => TState<GValue, [GF0, ...GInitialFeatures]>,
	f2: (
		state: TState<GValue, [GF0, ...GInitialFeatures]>
	) => TState<GValue, [GF1, GF0, ...GInitialFeatures]>,
	f3: (
		state: TState<GValue, [GF1, GF0, ...GInitialFeatures]>
	) => TState<GValue, [GF2, GF1, GF0, ...GInitialFeatures]>
): TState<GValue, [GF2, GF1, GF0, ...GInitialFeatures]>;

// Implementation
export function applyFeatures<
	GValue,
	GInitialFeatures extends TFeatureDefinition[],
	GF0 extends TFeatureDefinition,
	GF1 extends TFeatureDefinition,
	GF2 extends TFeatureDefinition
>(
	initialState: TState<GValue, GInitialFeatures>,
	f1: (state: TState<GValue, GInitialFeatures>) => GF0,
	f2?: (state: TState<GValue, [GF0, ...GInitialFeatures]>) => GF1,
	f3?: (state: TState<GValue, [GF1, GF0, ...GInitialFeatures]>) => GF2
): TState<GValue, any> {
	// TODO: Implement
	return null as any;
}
