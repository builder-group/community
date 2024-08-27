import {
	FetchError,
	hasFeatures,
	type TEnforceFeatures,
	type TFeatureKeys,
	type TFetchClient,
	type TSelectFeatures
} from 'feature-fetch';

import type { paths } from './gen/v1';
import {
	type TFileAddress,
	type TLabelFormat,
	type TLabelType,
	type TLanguage,
	type TProductGroup,
	type TRegistrationNumber,
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
		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100854
		async getProductGroups(this: TFetchClient<['base', 'openapi', 'eprel'], paths>) {
			const result = await this.get('/product-groups');
			return result.unwrap().data;
		},

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

			return result.unwrap().data;
		},

		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100856
		async getProductByRegistrationNumber(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber
		) {
			const result = await this.get('/product/{registrationNumber}', {
				pathParams: { registrationNumber }
			});
			return result.unwrap().data;
		},

		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100857
		async getProductFiche(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber,
			options: {
				noRedirect?: boolean;
				language?: TLanguage;
			} = {}
		) {
			const { noRedirect, language } = options;
			const result = await this.get('/product/{registrationNumber}/fiches', {
				pathParams: { registrationNumber },
				queryParams: { noRedirect, language },
				parseAs: noRedirect ? 'json' : 'arrayBuffer'
			});
			const data = result.unwrap().data;
			return data instanceof ArrayBuffer ? new Uint8Array(data) : (data as TFileAddress);
		},

		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100858
		async getProductLabel(
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
			const data = result.unwrap().data;
			return data instanceof ArrayBuffer ? new Uint8Array(data) : (data as TFileAddress);
		},

		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100859
		async getNestedLabel(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			registrationNumber: TRegistrationNumber
		) {
			const result = await this.get('/product/{registrationNumber}/nested-label', {
				pathParams: { registrationNumber },
				parseAs: 'arrayBuffer'
			});
			return new Uint8Array(result.unwrap().data);
		},

		// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100908
		async exportProductGroupModels(
			this: TFetchClient<['base', 'openapi', 'eprel'], paths>,
			productGroup: TProductGroup
		) {
			const result = await this.get('/exportProducts/{productGroup}', {
				pathParams: { productGroup },
				parseAs: 'arrayBuffer'
			});
			return new Uint8Array(result.unwrap().data);
		}
	};

	// Merge existing features from the state with the new api feature
	const _fetchClient = Object.assign(fetchClient, eprelFeature);

	return _fetchClient as TFetchClient<['eprel', ...GSelectedFeatureKeys], paths>;
}
