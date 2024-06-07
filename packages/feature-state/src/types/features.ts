import type { TUnionToIntersection } from '@ibg/utils';

export type TFeatures<GValue = unknown> = {
	base: { _: null }; // TODO: Placeholder Feature: Figure out how to make the TS infer work with [] (empty array -> no feature)
	undo: { undo: () => void; _history: GValue[] };
	multiundo: {
		multiUndo: (count: number) => void;
	};
	persist: { persist: () => Promise<boolean>; deletePersisted: () => Promise<boolean> };
} & TThirdPartyFeatures;

// Global registry for third party features
// eslint-disable-next-line @typescript-eslint/no-empty-interface -- Overwritten by third party libraries
export interface TThirdPartyFeatures {}

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
	Exclude<GToEnforceFeatureKeys, GFeatureKeys> extends never
		? GFeatureKeys
		: GFeatureKeys | Exclude<GToEnforceFeatureKeys, GFeatureKeys>;
