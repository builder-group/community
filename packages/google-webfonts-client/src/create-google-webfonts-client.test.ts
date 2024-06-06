import { describe, expect, it } from 'vitest';

import { createGoogleWebfontsClient } from './create-google-webfonts-client';

describe('createGoogleClient function tests', () => {
	it('should have correct types', async () => {
		const client = createGoogleWebfontsClient({
			apiKey: '-'
		});

		const fileResponse = await client.downloadFontFile('Roboto Serif', {
			fontWeight: 100,
			fontStyle: 'italic'
		});

		const webfontsResponse = await client.get('/webfonts', {
			queryParams: {
				key: 'test'
			}
		});

		expect(fileResponse).not.toBeNull();
	});
});
