import type { TEnforceFeatures, TFeatureKeys, TFetchClient, TSelectFeatures } from '../../types';

export function withGraphQL<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>
): TFetchClient<['graphql', ...GSelectedFeatureKeys]> {
	const graphqlFeature: TSelectFeatures<['graphql']> = {
		async query(this: TFetchClient<['base']>, query: string, options = {}) {
			return this._baseFetch('', 'POST', {
				...options,
				body: {
					query,
					variables: options.variables ?? {}
				}
			});
		}
	};

	// Merge existing features from the fetch client with the new graphql feature
	const _fetchClient = Object.assign(fetchClient, graphqlFeature) as TFetchClient<
		['graphql', ...GSelectedFeatureKeys]
	>;
	_fetchClient._features.push('graphql');

	return _fetchClient;
}
