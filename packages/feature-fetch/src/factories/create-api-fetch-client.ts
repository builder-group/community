import { withApi } from '../features';
import type { TFetchClient, TFetchClientOptions } from '../types';
import { createFetchClient } from './create-fetch-client';

export function createApiFetchClient(
	options: TFetchClientOptions = {}
): TFetchClient<['base', 'api']> {
	return withApi(createFetchClient(options));
}
