import { withOpenApi } from '../features';
import type { TFetchClient, TFetchClientOptions } from '../types';
import { createFetchClient } from './create-fetch-client';

export function createOpenApiFetchClient<GPaths extends {} = {}>(
	options: TFetchClientOptions = {}
): TFetchClient<['base', 'openapi'], GPaths> {
	return withOpenApi(createFetchClient(options));
}
