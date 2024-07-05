import type { TUnionToIntersection } from '@ibg/types/utils';

export type TFeatures = {
	base: { _: null }; // TODO: Placeholder Feature: Figure out how to make the TS infer work with [] (empty array -> no feature)
	prefix: { _: null };
	timestamp: { _: null };
	methodPrefix: { _: null };
} & TThirdPartyFeatures;

// Global registry for third party features
// eslint-disable-next-line @typescript-eslint/no-empty-interface -- Overwritten by third party libraries
export interface TThirdPartyFeatures {}

export type TFeatureKeys = keyof TFeatures;

export type TSelectFeatureObjects<GSelectedFeatureKeys extends TFeatureKeys[]> = {
	[K in GSelectedFeatureKeys[number]]: TFeatures[K];
};

export type TSelectFeatures<
	GSelectedFeatureKeys extends TFeatureKeys[],
	GSelectedFeatureObjects extends
		TSelectFeatureObjects<GSelectedFeatureKeys> = TSelectFeatureObjects<GSelectedFeatureKeys>
> = TUnionToIntersection<GSelectedFeatureObjects[keyof GSelectedFeatureObjects]>;

export type TEnforceFeatures<
	GFeatureKeys extends TFeatureKeys[],
	GToEnforceFeatureKeys extends TFeatureKeys[]
> =
	Exclude<GToEnforceFeatureKeys[number], GFeatureKeys[number]> extends never
		? GFeatureKeys
		: GFeatureKeys | GToEnforceFeatureKeys;
