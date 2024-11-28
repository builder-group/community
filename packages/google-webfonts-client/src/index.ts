import type { FetchError, TFetchClient, TResult } from 'feature-fetch';
import type { components } from './gen/v1';
import {
	type TFontCapability,
	type TFontFamily,
	type TFontStyle,
	type TFontSubset,
	type TSort
} from './types';

export * from 'feature-fetch';
export * from './create-google-webfonts-client';
export * from './types';
export * from './with-google-webfonts';

declare module 'feature-fetch' {
	interface TThirdPartyFeatures<GPaths> {
		'google-webfonts': {
			_apiFetchClient: TFetchClient<['base', 'api']>;
			getWebFonts(options?: {
				family?: TFontFamily;
				subset?: TFontSubset;
				capability?: TFontCapability;
				sort?: TSort;
			}): Promise<TResult<components['schemas']['WebfontList'], FetchError>>;
			getFontFileUrl(
				familiy: TFontFamily,
				options: {
					fontWeight?: number;
					fontStyle?: TFontStyle;
					capability?: TFontCapability;
				}
			): Promise<TResult<string | null, FetchError>>;
			downloadFontFile(
				familiy: TFontFamily,
				options: {
					fontWeight?: number;
					fontStyle?: TFontStyle;
					capability?: TFontCapability;
				}
			): Promise<TResult<Uint8Array | null, FetchError>>;
		};
	}
}
