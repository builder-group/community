import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import type { TApiFeature, TFetchClient } from '../../types';

export function withApi<GFeatures extends TFeatureDefinition[]>(
	fetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
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

	// Merge existing features from the fetch client with the new api feature
	const _fetchClient = Object.assign(fetchClient, apiFeature) as TFetchClient<[TApiFeature]>;
	_fetchClient._features.push('api');

	return _fetchClient as unknown as TFetchClient<[TApiFeature, ...GFeatures]>;
}
