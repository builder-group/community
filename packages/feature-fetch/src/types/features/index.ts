import type { TUnionToIntersection } from '@ibg/utils';

import type { TApiFeature } from './api';
import type { TOpenApiFeature } from './openapi';

export * from './api';
export * from './openapi';

export type TFeatures<GPaths extends object = object> = {
	base: { _: null }; // TODO: Placeholder Feature: Figure out how to make the TS infer work with [] (empty array -> no feature)
	api: TApiFeature;
	openapi: TOpenApiFeature<GPaths>;
	retry: { _: null };
} & TThirdPartyFeatures;

// Global registry for third party features
// eslint-disable-next-line @typescript-eslint/no-empty-interface -- Overwritten by third party libraries
export interface TThirdPartyFeatures {}

export type TFeatureKeys<GPaths extends object = object> = keyof TFeatures<GPaths>;

export type TSelectFeatureObjects<
	GPaths extends object,
	GSelectedFeatureKeys extends TFeatureKeys<GPaths>[]
> = {
	[K in GSelectedFeatureKeys[number]]: TFeatures<GPaths>[K];
};

export type TSelectFeatures<
	GSelectedFeatureKeys extends TFeatureKeys<GPaths>[],
	GPaths extends object = object,
	GSelectedFeatureObjects extends TSelectFeatureObjects<
		GPaths,
		GSelectedFeatureKeys
	> = TSelectFeatureObjects<GPaths, GSelectedFeatureKeys>
> = TUnionToIntersection<GSelectedFeatureObjects[keyof GSelectedFeatureObjects]>;

export type TEnforceFeatures<
	GFeatureKeys extends TFeatureKeys[],
	GToEnforceFeatureKeys extends TFeatureKeys[]
> =
	Exclude<GToEnforceFeatureKeys, GFeatureKeys> extends never
		? GFeatureKeys
		: GFeatureKeys | Exclude<GToEnforceFeatureKeys, GFeatureKeys>;
