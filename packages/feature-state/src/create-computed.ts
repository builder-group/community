import { defineFeature, type TAnyFeature, type TFeature } from 'feature-core';
import { createState } from './create-state';
import type { TState, TStateBase, TStateValue } from './types';

/**
 * Creates a read-only state derived from one source state or a tuple of source states.
 *
 * Subscribes to sources while observed. Without listeners, reads refresh the cached value.
 * Keep `compute` pure. Calling `set()` or assigning `value` throws: update source states instead.
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
	const initialValues = sources.map((source) => source.get());

	const computedState = createState(compute(isTupleInput ? initialValues : initialValues[0])).with(
		defineFeature<TComputedFeature<GValue, typeof sources>>({
			key: 'computed',
			overrides: ['value', 'get', 'set'],
			install(host: Pick<TStateBase<GValue>, '_v'>) {
				return {
					value: host._v, // Note: Replaced by Object.defineProperty below
					_sources: sources,
					_sourceUnsubscribes: [],
					_lastSourceVersions: sources.map((source) => source._version),
					get(this: TComputedState<GValue, typeof sources>): GValue {
						if (!this._sourceUnsubscribes.length) {
							this._refresh(false);
						}
						return this._v;
					},
					set(_value: never, _options?: never) {
						throw new Error(
							'Cannot call set() on a computed state. Update the source states instead.'
						);
					},
					_refresh(
						this: TComputedState<GValue, typeof sources>,
						fromSourceNotification: boolean,
						background?: boolean
					): void {
						// Note: Read values first because unobserved computed sources may advance their versions
						const values = this._sources.map((source) => source.get());
						const versions = this._sources.map((source) => source._version);
						if (
							// Note: Process every source notification because isEqual: false disables
							// equality checking, even when queued callbacks see an already-cached version
							!fromSourceNotification &&
							versions.every((version, index) => version === this._lastSourceVersions[index])
						) {
							return;
						}

						const nextValue = compute(isTupleInput ? values : values[0]);
						const prevValue = this._v;
						const isValueEqual = isEqual !== false && isEqual(prevValue, nextValue);
						this._lastSourceVersions = versions;
						if (isValueEqual) {
							return;
						}

						this._v = nextValue;
						if (fromSourceNotification) {
							this.notify({
								listenerContext:
									background === true
										? { source: computedSourceKey, background }
										: { source: computedSourceKey },
								prevValue
							});
						} else {
							// Note: Downstream computations need this revision to detect changes on their next read
							this._version++;
						}
					}
				};
			}
		})
	);

	// Note: Feature installation uses Object.assign(), which cannot install accessors
	Object.defineProperty(computedState, 'value', {
		configurable: true,
		enumerable: true,
		get() {
			return computedState.get();
		},
		set() {
			throw new Error(
				'Cannot assign to value on a computed state. Update the source states instead.'
			);
		}
	});

	computedState._listenerLifecycle = {
		connect() {
			try {
				for (const source of new Set(sources)) {
					computedState._sourceUnsubscribes.push(
						source.listen(({ background }) => computedState._refresh(true, background))
					);
				}
				computedState._refresh(false);
			} catch (error) {
				this.disconnect();
				throw error;
			}
		},
		disconnect() {
			for (const unsubscribe of computedState._sourceUnsubscribes) {
				unsubscribe();
			}
			computedState._sourceUnsubscribes.length = 0;
		}
	};

	return computedState;
}

/** Source key set on the listener context when a computed state recomputes. */
export const computedSourceKey = 'computed';

export interface TCreateComputedOptions<GValue> {
	/**
	 * Compares computed values. Defaults to `Object.is`.
	 * Pass `false` to notify on every source update while observed.
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
> = TFeature<'computed', TComputedFeatureApi<GValue, GSources>, [], 'value' | 'get' | 'set'>;

export interface TComputedFeatureApi<GValue, GSources extends readonly TAnyComputedSourceState[]> {
	/** @internal */
	readonly _sources: GSources;
	/** @internal */
	_sourceUnsubscribes: Array<() => void>;
	/** @internal */
	_lastSourceVersions: number[];
	/** The current computed value. Read-only: update the source states to change it. */
	readonly value: GValue;
	/** Returns the current value, refreshing from sources when unobserved. */
	get(): GValue;
	/** Always throws. Update the source states instead. */
	set(value: never, options?: never): void;
	/**
	 * Refreshes the cached value.
	 * @internal
	 */
	_refresh(fromSourceNotification: boolean, background?: boolean): void;
}

type TComputedValues<GSources extends readonly TAnyComputedSourceState[]> = {
	readonly [GIndex in keyof GSources]: TStateValue<GSources[GIndex]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- used only to accept arbitrary source state value types
type TAnyComputedSourceState = TState<any, TAnyFeature[]>;
