import { createFetchClient } from '../../create-fetch-client';
import type { TFetchClient, TFetchClientOptions } from '../../types';
import { withApi } from './with-api';

export function createApiFetchClient(
	options: TFetchClientOptions = {}
): TFetchClient<['base', 'api']> {
	return withApi(createFetchClient(options));
}
