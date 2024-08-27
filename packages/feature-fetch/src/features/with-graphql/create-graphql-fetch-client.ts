import { createFetchClient } from '../../create-fetch-client';
import type { TFetchClient, TFetchClientOptions } from '../../types';
import { withGraphQL } from './with-graphql';

export function createGraphQLFetchClient(
	options: TFetchClientOptions = {}
): TFetchClient<['base', 'graphql']> {
	return withGraphQL(createFetchClient(options));
}
