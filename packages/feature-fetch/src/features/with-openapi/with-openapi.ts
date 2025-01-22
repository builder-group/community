import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import type { TFetchClient, TOpenApiFeature } from '../../types';

export function withOpenApi<GPaths extends object, GFeatures extends TFeatureDefinition[]>(
	baseFetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
): TFetchClient<[TOpenApiFeature<GPaths>, ...GFeatures]> {
	const openApiFeature: TOpenApiFeature<GPaths>['api'] = {
		get(this: TFetchClient<[]>, path, options) {
			return this._baseFetch(path as string, 'GET', options as any);
		},
		post(this: TFetchClient<[]>, path, body, options) {
			return this._baseFetch(path as string, 'POST', {
				...(options as any),
				body
			});
		},
		put(this: TFetchClient<[]>, path, body, options) {
			return this._baseFetch(path as string, 'PUT', {
				...(options as any),
				body
			});
		},
		del(this: TFetchClient<[]>, path, options) {
			return this._baseFetch(path as string, 'DELETE', options as any);
		}
	};

	// Extend the base fetch client with the openapi feature
	const extendedFetchClient = Object.assign(baseFetchClient, openApiFeature) as TFetchClient<
		[TOpenApiFeature<GPaths>]
	>;
	extendedFetchClient._features.push('openapi');

	return extendedFetchClient as unknown as TFetchClient<[TOpenApiFeature<GPaths>, ...GFeatures]>;
}
