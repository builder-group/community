import { TListenerContext, TListenerOptions, TState, TStateValue } from 'feature-state';
import React from 'react';

// 1 state
export function useCombinedCompute<S1 extends TState<any, any>, GComputed>(
	states: readonly [S1],
	compute: (cxs: readonly [TListenerContext<TStateValue<S1>>]) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<TStateValue<S1>, GComputed>
): GComputed;

// 2 states
export function useCombinedCompute<
	S1 extends TState<any, any>,
	S2 extends TState<any, any>,
	GComputed
>(
	states: readonly [S1, S2],
	compute: (
		cxs: readonly [TListenerContext<TStateValue<S1>>, TListenerContext<TStateValue<S2>>]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<TStateValue<S1> | TStateValue<S2>, GComputed>
): GComputed;

// 3 states
export function useCombinedCompute<
	S1 extends TState<any, any>,
	S2 extends TState<any, any>,
	S3 extends TState<any, any>,
	GComputed
>(
	states: readonly [S1, S2, S3],
	compute: (
		cxs: readonly [
			TListenerContext<TStateValue<S1>>,
			TListenerContext<TStateValue<S2>>,
			TListenerContext<TStateValue<S3>>
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		TStateValue<S1> | TStateValue<S2> | TStateValue<S3>,
		GComputed
	>
): GComputed;

// 4 states
export function useCombinedCompute<
	S1 extends TState<any, any>,
	S2 extends TState<any, any>,
	S3 extends TState<any, any>,
	S4 extends TState<any, any>,
	GComputed
>(
	states: readonly [S1, S2, S3, S4],
	compute: (
		cxs: readonly [
			TListenerContext<TStateValue<S1>>,
			TListenerContext<TStateValue<S2>>,
			TListenerContext<TStateValue<S3>>,
			TListenerContext<TStateValue<S4>>
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		TStateValue<S1> | TStateValue<S2> | TStateValue<S3> | TStateValue<S4>,
		GComputed
	>
): GComputed;

// 5 states
export function useCombinedCompute<
	S1 extends TState<any, any>,
	S2 extends TState<any, any>,
	S3 extends TState<any, any>,
	S4 extends TState<any, any>,
	S5 extends TState<any, any>,
	GComputed
>(
	states: readonly [S1, S2, S3, S4, S5],
	compute: (
		cxs: readonly [
			TListenerContext<TStateValue<S1>>,
			TListenerContext<TStateValue<S2>>,
			TListenerContext<TStateValue<S3>>,
			TListenerContext<TStateValue<S4>>,
			TListenerContext<TStateValue<S5>>
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		TStateValue<S1> | TStateValue<S2> | TStateValue<S3> | TStateValue<S4> | TStateValue<S5>,
		GComputed
	>
): GComputed;

// Implementation
export function useCombinedCompute<
	S1 extends TState<any, any>,
	S2 extends TState<any, any>,
	S3 extends TState<any, any>,
	S4 extends TState<any, any>,
	S5 extends TState<any, any>,
	GComputed
>(
	states: readonly TState<any, any>[],
	compute: (cxs: any) => GComputed,
	deps: React.DependencyList = [],
	options: TUseCombinedComputeOptions<
		TStateValue<S1> | TStateValue<S2> | TStateValue<S3> | TStateValue<S4> | TStateValue<S5>,
		GComputed
	> = {}
): GComputed {
	const { isEqual = Object.is, ...listenerOptions } = options;
	const [, forceRender] = React.useReducer((s) => s + 1, 0);

	const currentContextsRef = React.useRef<
		[
			TListenerContext<TStateValue<S1>>,
			TListenerContext<TStateValue<S2>>,
			TListenerContext<TStateValue<S3>>,
			TListenerContext<TStateValue<S4>>,
			TListenerContext<TStateValue<S5>>
		]
	>(
		states.map((state) => ({ value: state._v })) as unknown as [
			TListenerContext<TStateValue<S1>>,
			TListenerContext<TStateValue<S2>>,
			TListenerContext<TStateValue<S3>>,
			TListenerContext<TStateValue<S4>>,
			TListenerContext<TStateValue<S5>>
		]
	);
	const lastComputedRef = React.useRef<GComputed>(compute(currentContextsRef.current));

	React.useEffect(() => {
		const updateContext = (index: number, context: any, background?: boolean) => {
			currentContextsRef.current[index] = context;
			const newComputed = compute(currentContextsRef.current);

			// Only trigger re-render if computed value changed and not in background
			if (!background && (isEqual === false || !isEqual(newComputed, lastComputedRef.current))) {
				forceRender();
			}
			lastComputedRef.current = newComputed;
		};

		const unbinds = states.map((state, index) =>
			state.subscribe((context) => updateContext(index, context, context.background), {
				key: `use-combined-compute-${index}`,
				...listenerOptions
			})
		);

		return () => unbinds.forEach((unbind) => unbind());
	}, [...states, ...deps]);

	return lastComputedRef.current;
}

interface TUseCombinedComputeOptions<GValue, GComputed> extends TListenerOptions<GValue> {
	isEqual?: ((a: GComputed, b: GComputed) => boolean) | false;
}
