import { describe, expect, it } from 'vitest';
import { createGoogleWebfontsClient } from './create-google-webfonts-client';

describe('createGoogleWebfontsClient function tests', () => {
	it('should have correct types', async () => {
		const client = createGoogleWebfontsClient({
			apiKey: 'YOUR_API_KEY'
		});

		const fontFile = await client.downloadFontFile('Roboto Serif', {
			fontWeight: 100,
			fontStyle: 'italic'
		});

		const fontUrl = await client.getFontFileUrl('Roboto Serif', {
			fontWeight: 400,
			fontStyle: 'regular'
		});

		const webFontsResult = await client.get('/webfonts', {
			queryParams: {}
		});

		expect(fontFile).not.toBeNull();
	});
});
