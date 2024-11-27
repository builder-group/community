import type { TUnionToIntersection } from '@blgc/types/utils';
import type { TApiFeature } from './api';
import { type TGraphQLFeature } from './graphql';
import type { TOpenApiFeature } from './openapi';

export * from './api';
export * from './graphql';
export * from './openapi';

export type TFeatures<GPaths extends object = object> = {
	base: { _: null }; // TODO: Placeholder Feature: Figure out how to make the TS infer work with [] (empty array -> no feature)
	api: TApiFeature;
	openapi: TOpenApiFeature<GPaths>;
	graphql: TGraphQLFeature;
	retry: { _: null };
	delay: { _: null };
	cache: { _: null };
	graphqlCache: { _: null };
} & TThirdPartyFeatures<GPaths>;

// Global registry for third party features
// eslint-disable-next-line @typescript-eslint/no-empty-interface -- Overwritten by third party libraries
export interface TThirdPartyFeatures<GPaths> {}

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
	Exclude<GToEnforceFeatureKeys[number], GFeatureKeys[number]> extends never
		? GFeatureKeys
		: GFeatureKeys | GToEnforceFeatureKeys;
