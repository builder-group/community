import { createFetchClient } from '../../create-fetch-client';
import type { TApiFeature, TFetchClient, TFetchClientOptions } from '../../types';
import { withApi } from './with-api';

export function createApiFetchClient(
	options: TFetchClientOptions = {}
): TFetchClient<[TApiFeature]> {
	return withApi(createFetchClient(options));
}
