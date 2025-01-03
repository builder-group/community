import { createFetchClient } from '../../create-fetch-client';
import type { TFetchClient, TFetchClientOptions, TOpenApiFeature } from '../../types';
import { withOpenApi } from './with-openapi';

export function createOpenApiFetchClient<GPaths extends object = object>(
	options: TFetchClientOptions = {}
): TFetchClient<[TOpenApiFeature<GPaths>]> {
	return withOpenApi(createFetchClient(options));
}
