import type { TUnionToIntersection } from '@blgc/types/utils';
import { type TNestedPath } from '@blgc/utils';

import { type TListenerCallback, type TListenerOptions, type TStateSetOptions } from './state';

export type TFeatures<GValue = unknown> = {
	base: { _: null }; // TODO: Placeholder Feature: Figure out how to make the TS infer work with [] (empty array -> no feature)
	undo: { undo: (options?: TStateSetOptions<GValue>) => void; _history: GValue[] };
	multiundo: {
		multiUndo: (count: number) => void;
	};
	persist: {
		persist: () => Promise<boolean>;
		loadFormStorage: () => Promise<boolean>;
		deleteFormStorage: () => Promise<boolean>;
	};
	selector: {
		listenToSelected: (
			callIf: TNestedPath<GValue>[] | ((value: GValue) => unknown),
			callback: TListenerCallback<GValue>,
			options?: Omit<TListenerOptions<GValue>, 'callIf'>
		) => () => void;
	};
} & TThirdPartyFeatures<GValue>;

// Global registry for third party features
// eslint-disable-next-line @typescript-eslint/no-empty-interface -- Overwritten by third party libraries
export interface TThirdPartyFeatures<GValue> {}

export type TFeatureKeys<GValue = unknown> = keyof TFeatures<GValue>;

export type TSelectFeatureObjects<GValue, GSelectedFeatureKeys extends TFeatureKeys<GValue>[]> = {
	[K in GSelectedFeatureKeys[number]]: TFeatures<GValue>[K];
};

export type TSelectFeatures<
	GValue,
	GSelectedFeatureKeys extends TFeatureKeys<GValue>[],
	GSelectedFeatureObjects extends TSelectFeatureObjects<
		GValue,
		GSelectedFeatureKeys
	> = TSelectFeatureObjects<GValue, GSelectedFeatureKeys>
> = TUnionToIntersection<GSelectedFeatureObjects[keyof GSelectedFeatureObjects]>;

export type TEnforceFeatures<
	GFeatureKeys extends TFeatureKeys[],
	GToEnforceFeatureKeys extends TFeatureKeys[]
> =
	Exclude<GToEnforceFeatureKeys[number], GFeatureKeys[number]> extends never
		? GFeatureKeys
		: GFeatureKeys | GToEnforceFeatureKeys;
