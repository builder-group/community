import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import type { TFetchClient, TOpenApiFeature } from '../../types';

export function withOpenApi<GPaths extends object, GFeatures extends TFeatureDefinition[]>(
	fetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
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

	// Merge existing features from the fetch client with the new openapi feature
	const _fetchClient = Object.assign(fetchClient, openApiFeature) as TFetchClient<
		[TOpenApiFeature<GPaths>]
	>;
	_fetchClient._features.push('openapi');

	return _fetchClient as unknown as TFetchClient<[TOpenApiFeature<GPaths>, ...GFeatures]>;
}
