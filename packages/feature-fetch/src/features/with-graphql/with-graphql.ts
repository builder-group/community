import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { Err, Ok } from '@blgc/utils';
import type {
	TDocumentInput,
	TFetchClient,
	TGraphQLFeature,
	TGraphQLFetchResponse,
	TGraphQLQueryOptions,
	TGraphQLResponse
} from '../../types';
import { getQueryString } from './get-query-string';
import { GraphQLError } from './GraphQLError';

export function withGraphQL<GFeatures extends TFeatureDefinition[]>(
	baseFetchClient: TEnforceFeatureConstraint<TFetchClient<GFeatures>, TFetchClient<GFeatures>, []>
): TFetchClient<[TGraphQLFeature, ...GFeatures]> {
	const graphqlFeature: TGraphQLFeature['api'] = {
		async query<
			GSuccessResponseBody extends Record<string, any>,
			GVariables extends Record<string, any>,
			GErrorResponseBody = unknown
		>(
			this: TFetchClient<[]>,
			query: TDocumentInput<GSuccessResponseBody, GVariables>,
			options: TGraphQLQueryOptions<GVariables> = {}
		): Promise<TGraphQLFetchResponse<GSuccessResponseBody, GErrorResponseBody>> {
			const maybeQueryString = await getQueryString(query);
			if (maybeQueryString.isErr()) {
				return Err(maybeQueryString.error);
			}

			const result = await this._baseFetch<
				TGraphQLResponse<GSuccessResponseBody>,
				GErrorResponseBody,
				'json'
			>('', 'POST', {
				...options,
				parseAs: 'json',
				body: {
					query: maybeQueryString.value,
					variables: options.variables ?? {}
				}
			});
			if (result.isErr()) {
				return Err(result.error);
			}

			const response = result.value;
			const { data, errors, extensions } = response.data;

			// If there are GraphQL errors, return them even if there's partial data
			if (Array.isArray(errors) && errors.length > 0) {
				return Err(
					new GraphQLError('#ERR_GRAPHQL_QUERY', {
						errors,
						data,
						extensions,
						response: response.response
					})
				);
			}

			// For successful queries, return just the data
			return Ok({
				data: data as GSuccessResponseBody,
				extensions,
				response: response.response
			});
		},
		async queryRaw(this: TFetchClient<[]>, query, options = {}) {
			const maybeQueryString = await getQueryString(query);
			if (maybeQueryString.isErr()) {
				return Err(maybeQueryString.error);
			}

			return this._baseFetch('', 'POST', {
				...options,
				parseAs: 'json',
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
