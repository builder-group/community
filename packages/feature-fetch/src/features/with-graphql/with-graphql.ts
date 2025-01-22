import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { Err } from '@blgc/utils';
import type { TFetchClient, TGraphQLFeature } from '../../types';
import { getQueryString } from './get-query-string';

export function withGraphQL<GFeatures extends TFeatureDefinition[]>(
	baseFetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
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

	// Extend the base fetch client with the graphql feature
	const extendedFetchClient = Object.assign(baseFetchClient, graphqlFeature) as TFetchClient<
		[TGraphQLFeature]
	>;
	extendedFetchClient._features.push('graphql');

	return extendedFetchClient as unknown as TFetchClient<[TGraphQLFeature, ...GFeatures]>;
}
