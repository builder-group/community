import { describe, expect, it } from 'vitest';

import { createGoogleWebfontsClient } from './create-google-webfonts-client';

describe('createGoogleClient function tests', () => {
	it('should have correct types', async () => {
		const client = createGoogleWebfontsClient({
			apiKey: '-'
		});

		// const response = await client.getWebFonts();
		// const data = response.unwrap();

		const response = await client.downloadFontFile('Roboto Serif', {
			fontWeight: 100,
			fontStyle: 'italic'
		});

		await client.get('/webfonts', {
			queryParams: {
				key: 'test'
			}
		});

		expect(response).not.toBeNull();
	});
});
