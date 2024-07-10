import { type Hono } from 'hono';

import {
	type TEnforceFeatures,
	type TFeatureKeys,
	type TOpenApiRouter,
	type TSelectFeatures
} from '../../types';

export function withHono<
	GPaths extends object,
	GSelectedFeatureKeys extends TFeatureKeys[] = ['base']
>(
	router: TOpenApiRouter<TEnforceFeatures<GSelectedFeatureKeys, ['base']>, GPaths>,
	hono: Hono
): TOpenApiRouter<['hono', ...GSelectedFeatureKeys], GPaths> {
	const honoFeatures: TSelectFeatures<['hono'], GPaths> = {
		_hono: hono,
		get(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			this._hono.get(path, config.handler);
		},
		post(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			// TODO
		},
		put(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			// TODO
		},
		del(this: TOpenApiRouter<['base', 'hono'], GPaths>, path, config) {
			// TODO
		}
	};

	// Merge existing features from the router with the new hono feature
	const _router = Object.assign(router, honoFeatures) as TOpenApiRouter<
		['hono', ...GSelectedFeatureKeys],
		GPaths
	>;
	_router._features.push('hono');

	return _router;
}
