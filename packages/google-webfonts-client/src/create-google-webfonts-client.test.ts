import { describe, expect, it } from 'vitest';

import { createGoogleWebfontsClient } from './create-google-webfonts-client';

describe('createGoogleClient function tests', () => {
	it('should have correct types', async () => {
		const client = createGoogleWebfontsClient({
			apiKey: 'YOUR_API_KEY'
		});

		const fileResponse = await client.downloadFontFile('Roboto Serif', {
			fontWeight: 100,
			fontStyle: 'italic'
		});

		const urlResponse = await client.getFontFileUrl('Roboto Serif', {
			fontWeight: 400,
			fontStyle: 'regular'
		});

		const webfontsResponse = await client.get('/webfonts', {
			queryParams: {
				key: 'test'
			}
		});

		expect(fileResponse).not.toBeNull();
	});
});
