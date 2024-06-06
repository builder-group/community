import { describe, expect, it } from 'vitest';

import { createFetchClient } from '../../create-fetch-client';
import { withApi } from './with-api';

describe('withApi function tests', () => {
	it('should have correct types', async () => {
		const baseFetchClient = createFetchClient();
		const fetchClient = withApi(baseFetchClient);

		const response = await fetchClient.get('https://dummyjson.com/products/{id}', {
			pathParams: { id: '1' }
		});

		expect(response).not.toBeNull();
	});
});
