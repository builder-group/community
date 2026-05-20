import { type TAnyFeature } from 'feature-core';
import type { TState } from 'feature-state';
import React from 'react';
import { useEventCallback } from './use-event-callback';

/**
 * Computes a derived value from one state or a tuple of states.
 * The component re-renders only when the computed value changes.
 * `compute` and `isEqual` run during render and must stay pure.
 * Pass `isEqual` to customize equality; also preserves referential stability for object and array returns.
 */
export function useCompute<GValue, GFeatures extends TAnyFeature[], GComputed>(
	state: TState<GValue, GFeatures>,
	compute: (value: GValue) => GComputed,
	isEqual?: (next: GComputed, current: GComputed) => boolean
): GComputed;
export function useCompute<GValue, GFeatures extends TAnyFeature[], GComputed>(
	state: TState<GValue, GFeatures> | null | undefined,
	compute: (value: GValue | null) => GComputed,
	isEqual?: (next: GComputed, current: GComputed) => boolean
): GComputed;
export function useCompute<const GStates extends readonly TAnyComputeState[], GComputed>(
	states: GStates,
	compute: (values: TComputeValues<GStates>) => GComputed,
	isEqual?: (next: GComputed, current: GComputed) => boolean
): GComputed;
export function useCompute<GComputed>(
	input: unknown,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	compute: (value: any) => GComputed,
	isEqual: (next: GComputed, current: GComputed) => boolean = Object.is
): GComputed {
	const isTupleInput = Array.isArray(input);
	const inputStates = (isTupleInput ? input : [input]) as readonly TAnyComputeState[];

	const [, forceRender] = React.useReducer((n: number) => n + 1, 0);

	const stableCompute = useEventCallback(compute);
	const stableIsEqual = useEventCallback(isEqual);

	const computed = compute(resolveValue(inputStates, isTupleInput));
	const computedRef = React.useRef(computed);
	// Note: Preserves the existing reference when equal so downstream memos and effects stay stable
	if (!isEqual(computed, computedRef.current)) {
		computedRef.current = computed;
	}

	React.useEffect(() => {
		const unbinds = inputStates.map((state) => {
			if (state == null) {
				return;
			}

			return state.listen(({ background }) => {
				const next = stableCompute(resolveValue(inputStates, isTupleInput));
				if (!stableIsEqual(next, computedRef.current)) {
					computedRef.current = next;
					if (background !== true) {
						forceRender();
					}
				}
			});
		});

		return () => {
			for (const unbind of unbinds) {
				unbind?.();
			}
		};
	}, [isTupleInput, stableCompute, stableIsEqual, ...inputStates]);

	return computedRef.current;
}

type TComputeValues<GStates extends readonly TAnyComputeState[]> = {
	readonly [GIndex in keyof GStates]: TComputeValue<GStates[GIndex]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary state value types in the public tuple overload
type TAnyComputeState = TState<any, TAnyFeature[]> | null | undefined;

type TComputeValue<GState> = GState extends TState<infer GValue, TAnyFeature[]> ? GValue : null;

function resolveValue(states: readonly TAnyComputeState[], isTupleInput: boolean): unknown {
	if (isTupleInput) {
		return states.map((state) => state?.get() ?? null);
	}
	return states[0]?.get() ?? null;
}
