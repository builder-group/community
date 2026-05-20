import { type TAnyFeature } from 'feature-core';
import type { TState } from 'feature-state';
import React from 'react';

/**
 * Derives a computed value from one state or a tuple of states.
 * Re-renders only when the computed result changes.
 *
 * Pass deps for every value that `compute` reads outside the subscribed state.
 * `compute` and `isEqual` must stay pure because React may call snapshots during render.
 */
export function useCompute<GState extends TAnyComputeState, GComputed>(
	state: GState,
	compute: (value: TComputeValue<GState>) => GComputed,
	deps?: React.DependencyList,
	isEqual?: TComputeIsEqual<GComputed>
): GComputed;
export function useCompute<const GStates extends readonly TAnyComputeState[], GComputed>(
	states: GStates,
	compute: (values: TComputeValues<GStates>) => GComputed,
	deps?: React.DependencyList,
	isEqual?: TComputeIsEqual<GComputed>
): GComputed;
export function useCompute<GComputed>(
	input: TAnyComputeState | readonly TAnyComputeState[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- implementation accepts all public overload value shapes
	compute: (value: any) => GComputed,
	deps: React.DependencyList = [],
	isEqual: TComputeIsEqual<GComputed> = Object.is
): GComputed {
	const isTupleInput = Array.isArray(input);
	const inputStates = (isTupleInput ? input : [input]) as readonly TAnyComputeState[];
	const states = React.useMemo(() => [...inputStates], [isTupleInput, ...inputStates]);
	const depsToken = React.useMemo(() => ({}), deps);
	const cacheRef = React.useRef<TComputeCache<GComputed>>({
		depsToken: null,
		dirty: true,
		hasValue: false,
		isTupleInput,
		value: undefined,
		values: []
	});

	const getSnapshot = React.useCallback((): GComputed => {
		const cache = cacheRef.current;
		const values = states.map((state) => (state == null ? null : state.get()));
		const didValuesChange =
			values.length !== cache.values.length ||
			values.some((value, index) => !Object.is(value, cache.values[index]));
		const shouldCompute =
			cache.dirty ||
			!cache.hasValue ||
			cache.isTupleInput !== isTupleInput ||
			cache.depsToken !== depsToken ||
			didValuesChange;

		if (!shouldCompute) {
			return cache.value as GComputed;
		}

		const nextValue = compute(isTupleInput ? values : values[0]);

		cache.dirty = false;
		cache.isTupleInput = isTupleInput;
		cache.depsToken = depsToken;
		cache.values = values;

		if (cache.hasValue && isEqual !== false && isEqual(nextValue, cache.value as GComputed)) {
			return cache.value as GComputed;
		}

		cache.hasValue = true;
		cache.value = nextValue;
		return nextValue;
	}, [compute, depsToken, isEqual, isTupleInput, states]);

	const subscribe = React.useCallback(
		(onStoreChange: () => void) => {
			const subscribedStates = new Set<TSubscribedState>();
			const unbinds: Array<() => void> = [];

			for (const state of states) {
				if (state == null || subscribedStates.has(state)) {
					continue;
				}

				subscribedStates.add(state);
				unbinds.push(
					state.listen(({ background }) => {
						// Note: notify() invalidates compute even when the state value keeps the same reference
						cacheRef.current.dirty = true;

						if (background !== true) {
							onStoreChange();
						}
					})
				);
			}

			return () => {
				for (const unbind of unbinds) {
					unbind();
				}
			};
		},
		[states]
	);

	return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export type TComputeIsEqual<GComputed> = ((next: GComputed, current: GComputed) => boolean) | false;

type TComputeValues<GStates extends readonly TAnyComputeState[]> = {
	readonly [GIndex in keyof GStates]: TComputeValue<GStates[GIndex]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary state value types in the public input
type TAnyComputeState = TState<any, TAnyFeature[]> | null | undefined;

type TSubscribedState = Exclude<TAnyComputeState, null | undefined>;

type TComputeValue<GState> = GState extends TState<infer GValue, TAnyFeature[]> ? GValue : null;

interface TComputeCache<GComputed> {
	depsToken: object | null;
	dirty: boolean;
	hasValue: boolean;
	isTupleInput: boolean;
	value: GComputed | undefined;
	values: readonly unknown[];
}
