import type * as express from 'express';

import { type TEnforceFeatures, type TFeatureKeys, type TOpenApiRouter } from '../../types';

export function withExpress<
	GPaths extends object,
	GSelectedFeatureKeys extends TFeatureKeys[] = ['base']
>(
	router: TOpenApiRouter<TEnforceFeatures<GSelectedFeatureKeys, ['base']>, GPaths>,
	expressRouter: express.Router
): TOpenApiRouter<['express', ...GSelectedFeatureKeys], GPaths> {
	return null as any;
}
