import { FetchError, TApiFeature, TFetchClient, TResult } from 'feature-fetch';
import { type components } from './gen/v1';

export interface TGoogleWebfontsFeature {
	key: 'google-webfonts';
	api: {
		_apiFetchClient: TFetchClient<[TApiFeature]>;
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

export type TFontFamily = components['parameters']['Family'];
export type TFontSubset = components['parameters']['Subset'];
export type TFontCapability = components['parameters']['Capability'];
export type TSort = components['parameters']['Sort'];
export type TFontStyle = 'italic' | 'regular';
