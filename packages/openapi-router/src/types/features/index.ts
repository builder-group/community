import { type TUnionToIntersection } from '@ibg/types/utils';

import { type TOpenApiExpressFeature } from './express';
import { type TOpenApiHonoFeature } from './hono';

export * from './express';

export type TFeatures<GPaths extends object = object> = {
	base: { _: null }; // TODO: Placeholder Feature: Figure out how to make the TS infer work with [] (empty array -> no feature)
	express: TOpenApiExpressFeature<GPaths>;
	hono: TOpenApiHonoFeature<GPaths>;
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
