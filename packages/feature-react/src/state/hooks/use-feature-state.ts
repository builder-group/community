import { type TAnyFeature } from 'feature-core';
import type { TState } from 'feature-state';
import React from 'react';

/**
 * Returns the current value of a state and re-renders the component on each change.
 *
 * Pass `null` or `undefined` to opt out: the hook returns `null` and registers no listener.
 * Background updates mark the change for the next render without forcing an immediate re-render.
 *
 * @param state - The state to subscribe to, or `null`/`undefined` to skip subscription.
 */
export function useFeatureState<GState extends TAnyFeatureState>(
	state: GState
): TFeatureStateValue<GState> {
	// Note: Wrapping value in a snapshot object (not returning the raw value) lets useSyncExternalStore
	// detect re-renders via reference equality: returning a new object forces a re-render even
	// when the raw value reference is unchanged (e.g. notify() called on a mutable object)
	const forceSnapshotRef = React.useRef(false);
	const snapshotRef = React.useRef<TFeatureStateSnapshot<TFeatureStateValue<GState>> | null>(null);

	const getSnapshot = React.useCallback((): TFeatureStateSnapshot<TFeatureStateValue<GState>> => {
		const snapshot = snapshotRef.current;
		const value = (state == null ? null : state.get()) as TFeatureStateValue<GState>;

		const shouldReuseSnapshot =
			!forceSnapshotRef.current && snapshot != null && Object.is(snapshot.value, value);
		forceSnapshotRef.current = false;
		if (shouldReuseSnapshot) {
			return snapshot;
		}

		const nextSnapshot = { value };
		snapshotRef.current = nextSnapshot;
		return nextSnapshot;
	}, [state]);

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

			if (state == null) {
				return () => {};
			}

			return state.listen(({ background }) => {
				emit(background);
			});
		},
		[state]
	);

	return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot).value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary state value types in the public input
type TAnyFeatureState = TState<any, TAnyFeature[]> | null | undefined;

type TFeatureStateValue<GState> =
	GState extends TState<infer GValue, TAnyFeature[]> ? GValue : null;

interface TFeatureStateSnapshot<GValue> {
	readonly value: GValue;
}
