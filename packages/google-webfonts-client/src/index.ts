import type { TFetchClient, TOpenApiFetchResponse, TResult } from 'feature-fetch';

import type { paths } from './gen/v1';

export * from 'feature-fetch';
export * from './create-google-webfonts-client';
export * from './with-google-webfonts';

declare module 'feature-fetch' {
	interface TThirdPartyFeatures<GPaths> {
		'google-webfonts': {
			_apiFetchClient: TFetchClient<['base', 'api']>;
			getWebFonts(
				options?: Omit<paths['/webfonts']['get']['parameters']['query'], 'key'>
			): Promise<TOpenApiFetchResponse<paths['/webfonts']['get'], 'json'>>;
			getFontFileUrl(
				familiy: Omit<paths['/webfonts']['get']['parameters']['query'], 'key'>['family'],
				options: {
					fontWeight?: number;
					fontStyle?: 'italic' | 'regular';
					capability?: Omit<paths['/webfonts']['get']['parameters']['query'], 'key'>['capability'];
				}
			): Promise<TResult<string | null, Error>>;
			downloadFontFile(
				familiy: Omit<paths['/webfonts']['get']['parameters']['query'], 'key'>['family'],
				options: {
					fontWeight?: number;
					fontStyle?: 'italic' | 'regular';
					capability?: Omit<paths['/webfonts']['get']['parameters']['query'], 'key'>['capability'];
				}
			): Promise<TResult<Uint8Array | null, Error>>;
		};
	}
}
