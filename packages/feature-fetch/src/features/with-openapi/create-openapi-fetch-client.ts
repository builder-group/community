import { createFetchClient } from '../../create-fetch-client';
import type { TFetchClient, TFetchClientOptions } from '../../types';
import { withOpenApi } from './with-openapi';

export function createOpenApiFetchClient<GPaths extends object = object>(
	options: TFetchClientOptions = {}
): TFetchClient<['base', 'openapi'], GPaths> {
	return withOpenApi(createFetchClient(options));
}
