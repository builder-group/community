import { defineFeature, type TAnyFeature, type TFeature } from 'feature-core';
import { createState } from './create-state';
import type { TState, TStateBase, TStateValue } from './types';

/**
 * Creates a read-only state derived from one source state or a tuple of source states.
 *
 * Recomputes and notifies listeners whenever a source changes. Calling `set()` or
 * assigning `value` throws: update the source states instead. Call `destroy()` when
 * the computed state is no longer needed to unsubscribe from its sources.
 */
export function createComputed<GState extends TAnyComputedSourceState, GValue>(
	source: GState,
	compute: (value: TStateValue<GState>) => GValue,
	options?: TCreateComputedOptions<GValue>
): TComputedState<GValue, readonly [GState]>;
export function createComputed<const GStates extends readonly TAnyComputedSourceState[], GValue>(
	sources: GStates,
	compute: (values: TComputedValues<GStates>) => GValue,
	options?: TCreateComputedOptions<GValue>
): TComputedState<GValue, GStates>;
export function createComputed<GValue>(
	input: TAnyComputedSourceState | readonly TAnyComputedSourceState[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- implementation accepts both public overload value shapes
	compute: (value: any) => GValue,
	options: TCreateComputedOptions<GValue> = {}
): TComputedState<GValue, readonly TAnyComputedSourceState[]> {
	const { isEqual = Object.is } = options;
	const isTupleInput = Array.isArray(input);
	const sources = (isTupleInput ? [...input] : [input]) as TAnyComputedSourceState[];
	const cleanups: Array<() => void> = [];

	const computeValue = (): GValue =>
		isTupleInput ? compute(sources.map((s) => s.get())) : compute(sources[0]?.get());

	const computedState = createState(computeValue()).with(
		defineFeature<TComputedFeature<GValue, typeof sources>>({
			key: 'computed',
			overrides: ['value', 'set'],
			install(host: Pick<TStateBase<GValue>, '_v'>) {
				return {
					value: host._v, // Note: Satisfies the override check; replaced by Object.defineProperty below
					_sources: sources,
					destroy() {
						for (const cleanup of cleanups) {
							cleanup();
						}
						cleanups.length = 0;
					},
					set(_value: never, _options?: never) {
						throw new Error(
							'Cannot call set() on a computed state. Update the source states instead.'
						);
					}
				};
			}
		})
	);

	// Note: feature-core installs via Object.assign() which cannot create a property setter;
	// Object.defineProperty is needed to make value assignment throw.
	Object.defineProperty(computedState, 'value', {
		configurable: true,
		enumerable: true,
		get() {
			return computedState._v;
		},
		set() {
			throw new Error(
				'Cannot assign to value on a computed state. Update the source states instead.'
			);
		}
	});

	const subscribedSources = new Set<TAnyComputedSourceState>();
	for (const source of sources) {
		if (subscribedSources.has(source)) {
			continue;
		}

		subscribedSources.add(source);
		cleanups.push(
			source.listen(({ background }) => {
				const nextValue = computeValue();
				const prevValue = computedState._v;
				if (isEqual !== false && isEqual(prevValue, nextValue)) {
					return;
				}
				// Note: _v is mutated directly because set() is overridden to throw on computed states
				computedState._v = nextValue;
				computedState.notify({
					listenerContext:
						background === true
							? { source: computedSourceKey, background }
							: { source: computedSourceKey },
					prevValue
				});
			})
		);
	}

	return computedState;
}

/** Source key set on the listener context when a computed state recomputes. */
export const computedSourceKey = 'computed';

export interface TCreateComputedOptions<GValue> {
	/**
	 * Compares the current computed value with the next one.
	 * Pass `false` to notify on every source update.
	 */
	isEqual?: TComputedIsEqual<GValue>;
}

/** Compares computed values, or disables equality checks when set to `false`. */
export type TComputedIsEqual<GValue> = ((prevValue: GValue, nextValue: GValue) => boolean) | false;

/** Read-only state derived from one or more source states. Created by `createComputed()`. */
export type TComputedState<GValue, GSources extends readonly TAnyComputedSourceState[]> = TState<
	GValue,
	[TComputedFeature<GValue, GSources>]
>;

export type TComputedFeature<
	GValue,
	GSources extends readonly TAnyComputedSourceState[]
> = TFeature<'computed', TComputedFeatureApi<GValue, GSources>, [], 'value' | 'set'>;

export interface TComputedFeatureApi<GValue, GSources extends readonly TAnyComputedSourceState[]> {
	/** The current computed value. Read-only: update the source states to change it. */
	readonly value: GValue;
	/** @internal */
	readonly _sources: GSources;
	/** Unsubscribes from all source states. Call this when the computed state is no longer needed to prevent memory leaks. */
	destroy(): void;
	/** Always throws. Update the source states instead. */
	set(value: never, options?: never): void;
}

type TComputedValues<GSources extends readonly TAnyComputedSourceState[]> = {
	readonly [GIndex in keyof GSources]: TStateValue<GSources[GIndex]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary source state value types
type TAnyComputedSourceState = TState<any, TAnyFeature[]>;
