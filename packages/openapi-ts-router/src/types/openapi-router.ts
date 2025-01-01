import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';

export type TOpenApiRouter<GFeatures extends TFeatureDefinition[]> = TWithFeatures<{}, GFeatures>;
