import { Err } from '@blgc/utils';

import type { TEnforceFeatures, TFeatureKeys, TFetchClient, TSelectFeatures } from '../../types';
import { getQueryString } from './get-query-string';

export function withGraphQL<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base']>>
): TFetchClient<['graphql', ...GSelectedFeatureKeys]> {
	const graphqlFeature: TSelectFeatures<['graphql']> = {
		async query(this: TFetchClient<['base']>, query, options = {}) {
			const maybeQueryString = getQueryString(query);
			if (maybeQueryString.isErr()) {
				return Err(maybeQueryString.error);
			}

			return this._baseFetch('', 'POST', {
				...options,
				body: {
					query: maybeQueryString.value,
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
