import {
	createApiFetchClient,
	hasFeatures,
	isStatusCode,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TSelectFeatures
} from 'feature-fetch';

import type { paths } from './gen/v1';
import { type TFontStyle } from './types';

const REGULAR_FONT_WEIGHT = 400;

export function withGoogleWebfonts<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base', 'openapi']>>
): TFetchClient<['google-webfonts', ...GSelectedFeatureKeys], paths> {
	if (!hasFeatures(fetchClient, ['openapi'])) {
		throw Error('FetchClient must have "openapi" feature to use withGoogleWebfonts');
	}
	fetchClient._features.push('google-webfonts');

	const googleWebfontsFeature: TSelectFeatures<['google-webfonts']> = {
		_apiFetchClient: createApiFetchClient(),
		async getWebFonts(
			this: TFetchClient<['base', 'openapi', 'google-webfonts'], paths>,
			options = {}
		) {
			const { capability, family, sort, subset } = options;
			const reuslt = await this.get('/webfonts', {
				queryParams: { capability, family, sort, subset }
			});
			return reuslt.unwrap().data;
		},
		async getFontFileUrl(
			this: TFetchClient<['base', 'openapi', 'google-webfonts'], paths>,
			family,
			options = {}
		) {
			const { fontWeight = 400, fontStyle = 'regular', capability } = options;

			// Fetch web fonts
			const reuslt = await this.get('/webfonts', {
				queryParams: { capability, family }
			});
			if (reuslt.isErr()) {
				if (isStatusCode(reuslt.error, 404)) {
					return null;
				}
				throw reuslt.error;
			}

			// Find the closest match for font family, weight and style
			const items = reuslt.value.data.items ?? [];
			const font = items.find((f) => f.family === family);
			if (font == null) {
				return null;
			}
			const closestVariant = findClosestVariant(font.variants ?? [], fontWeight, fontStyle);

			// Find font file URL
			if (font.files != null && closestVariant != null) {
				const fileUrl = font.files[closestVariant];
				if (fileUrl != null) {
					return fileUrl.replace('http://', 'https://');
				}
			}

			return null;
		},
		async downloadFontFile(
			this: TFetchClient<['base', 'openapi', 'google-webfonts'], paths>,
			family,
			options = {}
		) {
			// Fetch font download url
			const downloadUrl = await this.getFontFileUrl(family, options);
			if (downloadUrl == null) {
				return null;
			}

			// Fetch font binary
			const result = await this._apiFetchClient.get(downloadUrl, { parseAs: 'arrayBuffer' });
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return null;
				}
				throw result.error;
			}

			return new Uint8Array(result.value.data);
		}
	};

	// Merge existing features from the state with the new api feature
	const _fetchClient = Object.assign(fetchClient, googleWebfontsFeature);

	return _fetchClient as TFetchClient<['google-webfonts', ...GSelectedFeatureKeys], paths>;
}

// Find closest font variant identifier key
// e.g. 'regular', '100', '200', '200itlaic'
function findClosestVariant(
	variants: string[],
	fontWeight = REGULAR_FONT_WEIGHT,
	fontStyle: TFontStyle = 'regular'
): string | null {
	let variant: string;
	if (fontWeight === REGULAR_FONT_WEIGHT) {
		variant = fontStyle;
	} else if (fontStyle === 'regular') {
		variant = fontWeight.toString();
	} else {
		variant = `${fontWeight.toString()}${fontStyle}`;
	}

	if (variants.includes(variant)) {
		return variant;
	} else if (variants.includes(fontStyle)) {
		return fontStyle;
	} else if (variants.includes('regular')) {
		return 'regular';
	}

	return null;
}
