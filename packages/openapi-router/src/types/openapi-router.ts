import { type TFeatureKeys, type TSelectFeatures } from './features';

export type TOpenApiRouter<
	GSelectedFeatureKeys extends TFeatureKeys[],
	GPaths extends object = object
> = {
	_features: string[];
} & TSelectFeatures<GSelectedFeatureKeys, GPaths>;
