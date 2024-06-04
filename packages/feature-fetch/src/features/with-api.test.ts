import { describe, expect, it } from 'vitest';

import { createFetchClient } from '../factories/create-fetch-client';
import { withApi } from './with-api';

describe('withApi function tests', () => {
	it('should have correct types', async () => {
		const baseFetchClient = createFetchClient();
		const fetchClient = withApi(baseFetchClient);

		const response = await fetchClient.get('https://dummyjson.com/products/1');

		expect(response).not.toBeNull();
	});
});
