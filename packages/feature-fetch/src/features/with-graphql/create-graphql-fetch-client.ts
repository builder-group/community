import { createFetchClient } from '../../create-fetch-client';
import type { TFetchClient, TFetchClientOptions, TGraphQLFeature } from '../../types';
import { withGraphQL } from './with-graphql';

export function createGraphQLFetchClient(
	options: TFetchClientOptions = {}
): TFetchClient<[TGraphQLFeature]> {
	return withGraphQL(createFetchClient(options));
}
