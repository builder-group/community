import { type TAnyFeature } from 'feature-core';
import type { TState } from 'feature-state';
import React from 'react';

/**
 * Derives a computed value from one state or a tuple of states.
 *
 * Re-renders only when the computed result changes (`Object.is` by default).
 * Pass `deps` for any values `compute` reads outside the subscribed states.
 * Pass a custom `isEqual` to use structural comparison, or `false` to re-render on every
 * source change regardless of the computed value. Keep `compute` and `isEqual` pure:
 * React may call them outside a render.
 *
 * @param state - A single state or a tuple of states to subscribe to.
 * @param compute - Derives the result from the current state value(s).
 * @param deps - External values read by `compute`. Triggers recomputation when changed.
 * @param isEqual - Compares previous and next computed values. Defaults to `Object.is`.
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
	// Note: depsToken is a stable object whose identity changes when deps change, used as a cache key
	// to detect external dependency changes without tracking the compute function reference
	const depsToken = React.useMemo(() => ({}), deps);
	// Note: Wrapping computed value in a snapshot object (not returning the raw value) lets useSyncExternalStore
	// detect re-renders via reference equality: returning a new object forces a re-render even
	// when the raw computed value reference is unchanged (e.g. notify() called on a mutable object)
	const forceSnapshotRef = React.useRef(false);
	const snapshotRef = React.useRef<TComputeSnapshot<GComputed> | null>(null);
	const snapshotMetaRef = React.useRef<TComputeSnapshotMeta | null>(null);

	const getSnapshot = React.useCallback((): TComputeSnapshot<GComputed> => {
		const snapshot = snapshotRef.current;
		const meta = snapshotMetaRef.current;
		const values = states.map((state) => (state == null ? null : state.get()));

		const shouldReuseSnapshot =
			!forceSnapshotRef.current &&
			snapshot != null &&
			meta != null &&
			meta.depsToken === depsToken &&
			meta.states === states &&
			meta.values.length === values.length &&
			values.every((value, index) => Object.is(value, meta.values[index]));
		forceSnapshotRef.current = false;
		if (shouldReuseSnapshot) {
			return snapshot;
		}

		const nextValue = compute(isTupleInput ? values : values[0]);
		const nextMeta = { depsToken, states, values };
		if (snapshot != null && isEqual !== false && isEqual(nextValue, snapshot.value)) {
			snapshotMetaRef.current = nextMeta;
			return snapshot;
		}

		const nextSnapshot = { value: nextValue };
		snapshotRef.current = nextSnapshot;
		snapshotMetaRef.current = nextMeta;
		return nextSnapshot;
	}, [compute, depsToken, isEqual, isTupleInput, states]);

	const subscribe = React.useCallback(
		(onStoreChange: () => void) => {
			// Note: Force is set even for background updates so the next render picks up the
			// change lazily without triggering an immediate re-render
			function emit(background: boolean | undefined): void {
				forceSnapshotRef.current = true;
				if (background !== true) {
					onStoreChange();
				}
			}

			const subscribedStates = new Set<NonNullable<TAnyComputeState>>();
			const unbinds: Array<() => void> = [];
			for (const state of states) {
				if (state == null || subscribedStates.has(state)) {
					continue;
				}

				subscribedStates.add(state);
				unbinds.push(
					state.listen(({ background }) => {
						emit(background);
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

	return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot).value;
}

export type TComputeIsEqual<GComputed> = ((next: GComputed, current: GComputed) => boolean) | false;

type TComputeValues<GStates extends readonly TAnyComputeState[]> = {
	readonly [GIndex in keyof GStates]: TComputeValue<GStates[GIndex]>;
};

type TComputeValue<GState> = GState extends TState<infer GValue, TAnyFeature[]> ? GValue : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary state value types in the public input
type TAnyComputeState = TState<any, TAnyFeature[]> | null | undefined;

interface TComputeSnapshot<GComputed> {
	readonly value: GComputed;
}

interface TComputeSnapshotMeta {
	depsToken: object;
	states: readonly TAnyComputeState[];
	values: readonly unknown[];
}
