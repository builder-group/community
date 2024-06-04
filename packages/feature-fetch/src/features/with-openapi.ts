import type { TEnforceFeatures, TFeatureKeys, TFetchClient, TSelectFeatures } from '../types';

export function withOpenApi<
	GPaths extends {},
	GSelectedFeatureKeys extends TFeatureKeys[] = ['base']
>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>, GPaths>
): TFetchClient<['openapi', ...GSelectedFeatureKeys], GPaths> {
	fetchClient._features.push('openapi');

	const openApiFeature: TSelectFeatures<['openapi'], GPaths> = {
		get(this: TFetchClient<['base'], GPaths>, path, options = {} as any) {
			return this._baseFetch(path as string, 'GET', {
				...options,
				querySerializer: options.querySerializer as any
			});
		},
		post(this: TFetchClient<['base'], GPaths>, path, body, options = {} as any) {
			return this._baseFetch(path as string, 'POST', {
				...options,
				body,
				querySerializer: options.querySerializer as any
			});
		},
		put(this: TFetchClient<['base'], GPaths>, path, body, options = {} as any) {
			return this._baseFetch(path as string, 'PUT', {
				...options,
				body,
				querySerializer: options.querySerializer as any
			});
		},
		del(this: TFetchClient<['base'], GPaths>, path, options = {} as any) {
			return this._baseFetch(path as string, 'DELETE', {
				...options,
				querySerializer: options.querySerializer as any
			});
		}
	};

	// Merge existing features from the state with the new openapi feature
	const _fetchClient = Object.assign(fetchClient, openApiFeature);

	return _fetchClient as TFetchClient<['openapi', ...GSelectedFeatureKeys], GPaths>;
}
