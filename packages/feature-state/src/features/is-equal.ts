import { defineFeature, type TFeature } from 'feature-core';
import { setSourceKey } from '../create-state';
import type { TStateBase, TStateSetOptions } from '../types';

/** Overrides `set()` with a domain-specific equality check. */
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
	set(
		newValueOrUpdater: GValue | ((value: GValue) => GValue),
		options?: TStateSetOptions<GValue>
	): void;
}

export type TStateEquality<GValue> = (prevValue: GValue, nextValue: GValue) => boolean;
