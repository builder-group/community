import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import type { TApiFeature, TFetchClient } from '../../types';

export function withApi<GFeatures extends TFeatureDefinition[]>(
	baseFetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
): TFetchClient<[TApiFeature, ...GFeatures]> {
	const apiFeature: TApiFeature['api'] = {
		get(this: TFetchClient<[]>, path, options = {}) {
			return this._baseFetch(path, 'GET', options);
		},
		post(this: TFetchClient<[]>, path, body, options = {}) {
			return this._baseFetch(path, 'POST', { ...options, body });
		},
		put(this: TFetchClient<[]>, path, body, options = {}) {
			return this._baseFetch(path, 'PUT', { ...options, body });
		},
		del(this: TFetchClient<[]>, path, options = {}) {
			return this._baseFetch(path, 'DELETE', options);
		}
	};

	// Extend the base fetch client with the api feature
	const extendedFetchClient = Object.assign(baseFetchClient, apiFeature) as TFetchClient<
		[TApiFeature]
	>;
	extendedFetchClient._features.push('api');

	return extendedFetchClient as unknown as TFetchClient<[TApiFeature, ...GFeatures]>;
}
