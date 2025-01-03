import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { Err } from '@blgc/utils';
import type { TFetchClient, TGraphQLFeature } from '../../types';
import { getQueryString } from './get-query-string';

export function withGraphQL<GFeatures extends TFeatureDefinition[]>(
	fetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
): TFetchClient<[TGraphQLFeature, ...GFeatures]> {
	const graphqlFeature: TGraphQLFeature['api'] = {
		async query(this: TFetchClient<[]>, query, options = {}) {
			const maybeQueryString = await getQueryString(query);
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
		[TGraphQLFeature]
	>;
	_fetchClient._features.push('graphql');

	return _fetchClient as unknown as TFetchClient<[TGraphQLFeature, ...GFeatures]>;
}
