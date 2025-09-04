import { TListenerContext, TListenerOptions, TState, TStateValue } from 'feature-state';
import React from 'react';

// 1 state
export function useCombinedCompute<S1 extends TState<any, any> | undefined, GComputed>(
	states: readonly [S1],
	compute: (
		cxs: readonly [S1 extends TState<any, any> ? TListenerContext<TStateValue<S1>> : undefined]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		S1 extends TState<any, any> ? TStateValue<S1> : never,
		GComputed
	>
): GComputed;

// 2 states
export function useCombinedCompute<
	S1 extends TState<any, any> | undefined,
	S2 extends TState<any, any> | undefined,
	GComputed
>(
	states: readonly [S1, S2],
	compute: (
		cxs: readonly [
			S1 extends TState<any, any> ? TListenerContext<TStateValue<S1>> : undefined,
			S2 extends TState<any, any> ? TListenerContext<TStateValue<S2>> : undefined
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		| (S1 extends TState<any, any> ? TStateValue<S1> : never)
		| (S2 extends TState<any, any> ? TStateValue<S2> : never),
		GComputed
	>
): GComputed;

// 3 states
export function useCombinedCompute<
	S1 extends TState<any, any> | undefined,
	S2 extends TState<any, any> | undefined,
	S3 extends TState<any, any> | undefined,
	GComputed
>(
	states: readonly [S1, S2, S3],
	compute: (
		cxs: readonly [
			S1 extends TState<any, any> ? TListenerContext<TStateValue<S1>> : undefined,
			S2 extends TState<any, any> ? TListenerContext<TStateValue<S2>> : undefined,
			S3 extends TState<any, any> ? TListenerContext<TStateValue<S3>> : undefined
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		| (S1 extends TState<any, any> ? TStateValue<S1> : never)
		| (S2 extends TState<any, any> ? TStateValue<S2> : never)
		| (S3 extends TState<any, any> ? TStateValue<S3> : never),
		GComputed
	>
): GComputed;

// 4 states
export function useCombinedCompute<
	S1 extends TState<any, any> | undefined,
	S2 extends TState<any, any> | undefined,
	S3 extends TState<any, any> | undefined,
	S4 extends TState<any, any> | undefined,
	GComputed
>(
	states: readonly [S1, S2, S3, S4],
	compute: (
		cxs: readonly [
			S1 extends TState<any, any> ? TListenerContext<TStateValue<S1>> : undefined,
			S2 extends TState<any, any> ? TListenerContext<TStateValue<S2>> : undefined,
			S3 extends TState<any, any> ? TListenerContext<TStateValue<S3>> : undefined,
			S4 extends TState<any, any> ? TListenerContext<TStateValue<S4>> : undefined
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		| (S1 extends TState<any, any> ? TStateValue<S1> : never)
		| (S2 extends TState<any, any> ? TStateValue<S2> : never)
		| (S3 extends TState<any, any> ? TStateValue<S3> : never)
		| (S4 extends TState<any, any> ? TStateValue<S4> : never),
		GComputed
	>
): GComputed;

// 5 states
export function useCombinedCompute<
	S1 extends TState<any, any> | undefined,
	S2 extends TState<any, any> | undefined,
	S3 extends TState<any, any> | undefined,
	S4 extends TState<any, any> | undefined,
	S5 extends TState<any, any> | undefined,
	GComputed
>(
	states: readonly [S1, S2, S3, S4, S5],
	compute: (
		cxs: readonly [
			S1 extends TState<any, any> ? TListenerContext<TStateValue<S1>> : undefined,
			S2 extends TState<any, any> ? TListenerContext<TStateValue<S2>> : undefined,
			S3 extends TState<any, any> ? TListenerContext<TStateValue<S3>> : undefined,
			S4 extends TState<any, any> ? TListenerContext<TStateValue<S4>> : undefined,
			S5 extends TState<any, any> ? TListenerContext<TStateValue<S5>> : undefined
		]
	) => GComputed,
	deps?: React.DependencyList,
	options?: TUseCombinedComputeOptions<
		| (S1 extends TState<any, any> ? TStateValue<S1> : never)
		| (S2 extends TState<any, any> ? TStateValue<S2> : never)
		| (S3 extends TState<any, any> ? TStateValue<S3> : never)
		| (S4 extends TState<any, any> ? TStateValue<S4> : never)
		| (S5 extends TState<any, any> ? TStateValue<S5> : never),
		GComputed
	>
): GComputed;

// Implementation
export function useCombinedCompute<
	S1 extends TState<any, any> | undefined,
	S2 extends TState<any, any> | undefined,
	S3 extends TState<any, any> | undefined,
	S4 extends TState<any, any> | undefined,
	S5 extends TState<any, any> | undefined,
	GComputed
>(
	states: readonly (TState<any, any> | undefined)[],
	compute: (cxs: any) => GComputed,
	deps: React.DependencyList = [],
	options: TUseCombinedComputeOptions<
		| (S1 extends TState<any, any> ? TStateValue<S1> : never)
		| (S2 extends TState<any, any> ? TStateValue<S2> : never)
		| (S3 extends TState<any, any> ? TStateValue<S3> : never)
		| (S4 extends TState<any, any> ? TStateValue<S4> : never)
		| (S5 extends TState<any, any> ? TStateValue<S5> : never),
		GComputed
	> = {}
): GComputed {
	const { isEqual = Object.is, ...listenerOptions } = options;
	const [, forceRender] = React.useReducer((s) => s + 1, 0);

	const currentContextsRef = React.useRef<any[]>(
		states.map((state) => (state != null ? { value: state._v } : undefined))
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

		const unbinds = states.map((state, index) => {
			if (state == null) {
				return;
			}

			return state.subscribe((context) => updateContext(index, context, context.background), {
				key: `use-combined-compute-${index}`,
				...listenerOptions
			});
		});

		return () => unbinds.forEach((unbind) => unbind?.());
	}, [...states, ...deps]);

	return lastComputedRef.current;
}

interface TUseCombinedComputeOptions<GValue, GComputed> extends TListenerOptions<GValue> {
	isEqual?: ((a: GComputed, b: GComputed) => boolean) | false;
}
