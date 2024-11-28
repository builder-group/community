import { mapOk } from '@blgc/utils';
import {
	Err,
	FetchError,
	hasFeatures,
	isStatusCode,
	Ok,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TSelectFeatures
} from 'feature-fetch';
import type { paths } from './gen/v1';
import { getLabelUrl, getLanguageSet, getSheetUrl } from './helper';
import {
	type TFileAddress,
	type TLabelFormat,
	type TLabelType,
	type TProductGroup,
	type TRegistrationNumber,
	type TSheetLanguage,
	type TSortOption
} from './types';

export function withEPREL<GSelectedFeatureKeys extends TFeatureKeys[]>(
	fetchClient: TFetchClient<TEnforceFeatures<GSelectedFeatureKeys, ['base', 'openapi']>>
): TFetchClient<['eprel', ...GSelectedFeatureKeys], paths> {
	if (!hasFeatures(fetchClient, ['openapi'])) {
		throw Error('FetchClient must have "openapi" feature to use withEPREL');
	}
	fetchClient._features.push('eprel');

	const eprelFeature: TSelectFeatures<['eprel']> = {
		// Open, thus no API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100941
		async getProductGroups(this: TFetchClient<['base', 'openapi', 'eprel'], paths>) {
			const result = await this.get('/product-groups');
			return mapOk(result, (ok) => ok.data);
		},

		// API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100855
		async getModelsInProductGroup(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			productGroup: TProductGroup,
			options: {
				page?: number;
				limit?: number;
				// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100870
				sort?: TSortOption[];
				// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100863
				filter?: Record<string, string>;
				includeOldProducts?: boolean;
			} = {}
		) {
			const { page, limit, sort = [], includeOldProducts, filter = {} } = options;

			const sortParams: Record<`order${string}` | `sort${string}`, string> = {};
			if (sort.length > 3) {
				throw new FetchError('#ERR_MAX_3_SORT');
			}
			sort.forEach((sortOption, index) => {
				sortParams[`sort${index.toString()}`] = sortOption.field;
				sortParams[`order${index.toString()}`] = sortOption.order;
			});

			const result = await this.get('/products/{productGroup}', {
				pathParams: { productGroup },
				queryParams: {
					_page: page,
					_limit: limit,
					includeOldProducts,
					...sortParams,
					...filter
				}
			});

			return mapOk(result, (ok) => ok.data);
		},

		// Open, thus no API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100856
		async getProductByRegistrationNumber(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber
		) {
			const result = await this.get('/product/{registrationNumber}', {
				pathParams: { registrationNumber }
			});
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok(null);
				}
				return Err(result.error);
			}

			return Ok(result.value.data);
		},

		// Open, thus no API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100857
		async getProductSheets(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber,
			options: {
				noRedirect?: boolean;
				language?: TSheetLanguage;
			} = {}
		) {
			const { noRedirect = false, language } = options;

			const result = await this.get('/product/{registrationNumber}/fiches', {
				pathParams: { registrationNumber },
				queryParams: { noRedirect, language },
				parseAs: noRedirect ? 'json' : 'arrayBuffer'
			});
			if (result.isErr()) {
				return Err(result.error);
			}

			return Ok(
				result.value.data instanceof ArrayBuffer
					? (new Uint8Array(result.value.data) as any)
					: (result.value.data as TFileAddress)
			);
		},

		// Open, thus no API Key required
		async getProductSheetUrls(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber
		) {
			const result = await this.getProductByRegistrationNumber(registrationNumber);
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok([]);
				}
				return Err(result.error);
			}

			const { productGroup, placementCountries } = result.value ?? {};
			if (productGroup == null || placementCountries == null) {
				return Ok([]);
			}

			const languageSet = getLanguageSet(placementCountries);
			return Ok(
				Array.from(languageSet).map((l) => ({
					language: l,
					url: getSheetUrl(productGroup, registrationNumber, l)
				}))
			);
		},

		// Open, thus no API Key required
		async getProductSheetUrl(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber,
			language
		) {
			const result = await this.getProductByRegistrationNumber(registrationNumber);
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok(null);
				}
				return Err(result.error);
			}

			const { productGroup, placementCountries } = result.value ?? {};
			if (productGroup == null || placementCountries == null) {
				return Ok(null);
			}

			const languageSet = getLanguageSet(placementCountries);
			if (languageSet.has(language)) {
				return Ok(getSheetUrl(productGroup, registrationNumber, language));
			}

			return Ok(null);
		},

		// Open, thus no API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100858
		async getProductLabels(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber,
			options: {
				noRedirect?: boolean;
				format?: TLabelFormat;
				instance?: number;
				supplierLabel?: boolean;
				type?: TLabelType;
			} = {}
		) {
			const { noRedirect = false, format, instance, supplierLabel, type } = options;

			const result = await this.get('/product/{registrationNumber}/labels', {
				pathParams: { registrationNumber },
				queryParams: {
					noRedirect,
					format,
					instance,
					supplier_label: supplierLabel,
					type
				},
				parseAs: noRedirect ? 'json' : 'arrayBuffer'
			});

			if (result.isErr()) {
				return Err(result.error);
			}
			return Ok(
				result.value.data instanceof ArrayBuffer
					? (new Uint8Array(result.value.data) as any)
					: (result.value.data as TFileAddress)
			);
		},

		// Open, thus no API Key required
		async getProductLabelUrl(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber,
			format
		) {
			const result = await this.getProductByRegistrationNumber(registrationNumber);
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok(null);
				}
				return Err(result.error);
			}

			const { productGroup } = result.value ?? {};
			if (productGroup == null) {
				return Ok(null);
			}

			return Ok(getLabelUrl(productGroup, registrationNumber, format));
		},

		// Open, thus no API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100859
		async getNestedLabel(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber
		) {
			const result = await this.get('/product/{registrationNumber}/nested-label', {
				pathParams: { registrationNumber },
				parseAs: 'arrayBuffer'
			});
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok(null);
				}
				return Err(result.error);
			}

			return Ok(new Uint8Array(result.value.data));
		},

		// API Key required
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100908
		async exportProductGroupModels(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			productGroup: TProductGroup
		) {
			const result = await this.get('/exportProducts/{productGroup}', {
				pathParams: { productGroup },
				parseAs: 'arrayBuffer'
			});
			if (result.isErr()) {
				if (isStatusCode(result.error, 404)) {
					return Ok(null);
				}
				return Err(result.error);
			}

			return Ok(new Uint8Array(result.value.data));
		}
	};

	// Merge existing features from the state with the new api feature
	const _fetchClient = Object.assign(fetchClient, eprelFeature);

	return _fetchClient as TFetchClient<['eprel', ...GSelectedFeatureKeys], paths>;
}
