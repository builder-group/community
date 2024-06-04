import { describe, it } from 'vitest';

import type { paths } from '../__tests__/resources/mock-openapi-types';
import { createFetchClient } from '../factories/create-fetch-client';
import { withOpenApi } from './with-openapi';

describe('withOpenApi function tests', () => {
	it('should have correct types', async () => {
		const baseFetchClient = createFetchClient();
		const fetchClient = withOpenApi<paths>(baseFetchClient);
		const response = await fetchClient.get('/v1/media/pre-signed-download-url/{key}', {
			pathParams: {
				key: ''
			},
			parseAs: 'text'
		});
		const responseData = response.unwrap();

		const response2 = await fetchClient.post(
			'/v1/ping',
			{ jeff: 1, hello: 'world' },
			{
				queryParams: {
					test123: 1
				},
				pathParams: {
					shop_id: 1
				},
				querySerializer: (query) => {
					return query.test123.toString();
				},
				bodySerializer: (body) => {
					return JSON.stringify(body);
				}
			}
		);

		const jeff = response2.unwrap();

		fetchClient.get('/v1/ping', {
			pathParams: { test: '' }
		});
	});
});
