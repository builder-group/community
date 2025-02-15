import { TFeatureDefinition } from '@blgc/types/features';
import { TState } from 'feature-state';
import React from 'react';

// 1 state
export function useCombinedCompute<V1, F1 extends TFeatureDefinition[], GComputed>(
	states: readonly [TState<V1, F1>],
	compute: (values: readonly [V1]) => GComputed,
	options?: TCombinedComputeOptions<GComputed>,
	deps?: unknown[]
): GComputed;

// 2 states
export function useCombinedCompute<
	V1,
	F1 extends TFeatureDefinition[],
	V2,
	F2 extends TFeatureDefinition[],
	GComputed
>(
	states: readonly [TState<V1, F1>, TState<V2, F2>],
	compute: (values: readonly [V1, V2]) => GComputed,
	options?: TCombinedComputeOptions<GComputed>,
	deps?: unknown[]
): GComputed;

// 3 states
export function useCombinedCompute<
	V1,
	F1 extends TFeatureDefinition[],
	V2,
	F2 extends TFeatureDefinition[],
	V3,
	F3 extends TFeatureDefinition[],
	GComputed
>(
	states: readonly [TState<V1, F1>, TState<V2, F2>, TState<V3, F3>],
	compute: (values: readonly [V1, V2, V3]) => GComputed,
	options?: TCombinedComputeOptions<GComputed>,
	deps?: unknown[]
): GComputed;

// 4 states
export function useCombinedCompute<
	V1,
	F1 extends TFeatureDefinition[],
	V2,
	F2 extends TFeatureDefinition[],
	V3,
	F3 extends TFeatureDefinition[],
	V4,
	F4 extends TFeatureDefinition[],
	GComputed
>(
	states: readonly [TState<V1, F1>, TState<V2, F2>, TState<V3, F3>, TState<V4, F4>],
	compute: (values: readonly [V1, V2, V3, V4]) => GComputed,
	options?: TCombinedComputeOptions<GComputed>,
	deps?: unknown[]
): GComputed;

// 5 states
export function useCombinedCompute<
	V1,
	F1 extends TFeatureDefinition[],
	V2,
	F2 extends TFeatureDefinition[],
	V3,
	F3 extends TFeatureDefinition[],
	V4,
	F4 extends TFeatureDefinition[],
	V5,
	F5 extends TFeatureDefinition[],
	GComputed
>(
	states: readonly [TState<V1, F1>, TState<V2, F2>, TState<V3, F3>, TState<V4, F4>, TState<V5, F5>],
	compute: (values: readonly [V1, V2, V3, V4, V5]) => GComputed,
	options?: TCombinedComputeOptions<GComputed>,
	deps?: unknown[]
): GComputed;

// Implementation
export function useCombinedCompute<
	V1,
	F1 extends TFeatureDefinition[],
	V2,
	F2 extends TFeatureDefinition[],
	V3,
	F3 extends TFeatureDefinition[],
	V4,
	F4 extends TFeatureDefinition[],
	V5,
	F5 extends TFeatureDefinition[],
	GComputed
>(
	states: any,
	compute: (values: any) => GComputed,
	options: TCombinedComputeOptions<GComputed> = {},
	deps: unknown[] = []
): GComputed {
	const { isEqual = Object.is } = options;
	const [, forceRender] = React.useReducer((s) => s + 1, 0);

	const currentValuesRef = React.useRef<[V1, V2, V3, V4, V5]>(
		(
			states as readonly [
				TState<V1, F1>,
				TState<V2, F2>,
				TState<V3, F3>,
				TState<V4, F4>,
				TState<V5, F5>
			]
		).map((state) => state._v) as unknown as [V1, V2, V3, V4, V5]
	);
	const lastComputedRef = React.useRef<GComputed>(compute(currentValuesRef.current));

	React.useEffect(() => {
		const updateValue = (index: number, value: any, background?: boolean) => {
			currentValuesRef.current[index] = value;
			const newComputed = compute(currentValuesRef.current);

			// Only trigger re-render if computed value changed and not in background
			if (!background && !isEqual(newComputed, lastComputedRef.current)) {
				forceRender();
			}
			lastComputedRef.current = newComputed;
		};

		const unbinds = (
			states as readonly [
				TState<V1, F1>,
				TState<V2, F2>,
				TState<V3, F3>,
				TState<V4, F4>,
				TState<V5, F5>
			]
		).map((state, index) =>
			state.listen(({ background, value }) => updateValue(index, value, background), {
				key: `use-combined-compute-${index}`
			})
		);

		return () => unbinds.forEach((unbind) => unbind());
	}, [...states, ...deps]);

	return lastComputedRef.current;
}

interface TCombinedComputeOptions<GComputed> {
	isEqual?: (a: GComputed, b: GComputed) => boolean;
}
