import { TEnforceFeatureConstraint, TFeatureDefinition } from '@blgc/types/features';
import { mapOk } from '@blgc/utils';
import {
	createApiFetchClient,
	Err,
	isFetchClientWithFeatures,
	isStatusCode,
	Ok,
	TOpenApiFeature,
	type TFetchClient
} from 'feature-fetch';
import type { paths } from './gen/v1';
import { TGoogleWebfontsFeature, type TFontStyle } from './types';

const REGULAR_FONT_WEIGHT = 400;

export function withGoogleWebfonts<GFeatures extends TFeatureDefinition[]>(
	fetchClient: TEnforceFeatureConstraint<
		TFetchClient<GFeatures>,
		TFetchClient<GFeatures>,
		['openapi']
	>
): TFetchClient<[TGoogleWebfontsFeature, ...GFeatures]> {
	if (!isFetchClientWithFeatures<[TOpenApiFeature<paths>]>(fetchClient, ['openapi'])) {
		throw Error('FetchClient must have "openapi" feature to use withGoogleWebfonts');
	}

	const googleWebfontsFeature: TGoogleWebfontsFeature['api'] = {
		_apiFetchClient: createApiFetchClient(),
		async getWebFonts(
			this: TFetchClient<[TOpenApiFeature<paths>, TGoogleWebfontsFeature]>,
			options = {}
		) {
			const { capability, family, sort, subset } = options;
			const reuslt = await this.get('/webfonts', {
				queryParams: { capability, family, sort, subset }
			});
			return mapOk(reuslt, (ok) => ok.data);
		},
		async getFontFileUrl(
			this: TFetchClient<[TOpenApiFeature<paths>, TGoogleWebfontsFeature]>,
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
					return Ok(null);
				}
				return Err(reuslt.error);
			}

			// Find the closest match for font family, weight and style
			const items = reuslt.value.data.items ?? [];
			const font = items.find((f) => f.family === family);
			if (font == null) {
				return Ok(null);
			}
			const closestVariant = findClosestVariant(font.variants ?? [], fontWeight, fontStyle);

			// Find font file URL
			if (font.files != null && closestVariant != null) {
				const fileUrl = font.files[closestVariant];
				if (fileUrl != null) {
					return Ok(fileUrl.replace('http://', 'https://'));
				}
			}

			return Ok(null);
		},
		async downloadFontFile(
			this: TFetchClient<[TOpenApiFeature<paths>, TGoogleWebfontsFeature]>,
			family,
			options = {}
		) {
			// Fetch font download url
			const downloadUrlResult = await this.getFontFileUrl(family, options);
			if (downloadUrlResult.isErr()) {
				return Err(downloadUrlResult.error);
			}
			const downloadUrl = downloadUrlResult.value;
			if (downloadUrl == null) {
				return Ok(null);
			}

			// Fetch font binary
			const result = await this._apiFetchClient.get(downloadUrl, { parseAs: 'arrayBuffer' });
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok(null);
				}
				return Err(result.error);
			}

			return Ok(new Uint8Array(result.value.data));
		}
	};

	// Merge existing features from the fetch client with the new google webfonts feature
	const _fetchClient = Object.assign(fetchClient, googleWebfontsFeature) as TFetchClient<
		[TGoogleWebfontsFeature]
	>;
	_fetchClient._features.push('google-webfonts');

	return _fetchClient as unknown as TFetchClient<[TGoogleWebfontsFeature, ...GFeatures]>;
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
