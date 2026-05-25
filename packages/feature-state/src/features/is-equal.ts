import { defineFeature, type TFeature } from 'feature-core';
import { setSourceKey } from '../create-state';
import type { TStateBase, TStateSetOptions } from '../types';

/**
 * Replaces the default `Object.is` equality check in `set()` with a custom comparator.
 * Useful for value types that are structurally equal but not referentially equal, such as
 * arrays or objects where re-notifying listeners on the same logical value is wasteful.
 * `set()` calls `isEqual(prevValue, newValue)` and skips notification when it returns `true`.
 */
export function isEqualFeature<GValue>(isEqual: TStateEquality<GValue>): TIsEqualFeature<GValue> {
	return defineFeature<TIsEqualFeature<GValue>>({
		key: 'is-equal',
		overrides: ['set'],
		install() {
			return {
				/** @internal */
				_isEqual: isEqual,
				set(
					this: TStateBase<GValue> & TIsEqualFeatureApi<GValue>,
					newValueOrUpdater,
					setOptions = {}
				) {
					const newValue =
						typeof newValueOrUpdater === 'function'
							? (newValueOrUpdater as (value: GValue) => GValue)(this._v)
							: newValueOrUpdater;
					const prevValue = this._v;
					if (this._isEqual(prevValue, newValue)) {
						return;
					}

					const { listenerContext = {} } = setOptions;
					this._v = newValue;
					this.notify({
						listenerContext: {
							...listenerContext,
							source: listenerContext.source ?? setSourceKey
						},
						prevValue
					});
				}
			};
		}
	});
}

export type TIsEqualFeature<GValue> = TFeature<'is-equal', TIsEqualFeatureApi<GValue>, [], 'set'>;

export interface TIsEqualFeatureApi<GValue> {
	/** @internal */
	_isEqual: TStateEquality<GValue>;
	/** Sets the value and skips notification when the installed equality function returns `true`. */
	set(
		newValueOrUpdater: GValue | ((value: GValue) => GValue),
		options?: TStateSetOptions<GValue>
	): void;
}

/** Returns `true` when two state values should be treated as equal. */
export type TStateEquality<GValue> = (prevValue: GValue, nextValue: GValue) => boolean;
