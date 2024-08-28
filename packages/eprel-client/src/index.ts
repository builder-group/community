/* eslint-disable @typescript-eslint/method-signature-style -- Ok here */
import type { components } from './gen/v1';
import {
	type TFileAddress,
	type TLabelFormat,
	type TLabelType,
	type TLanguage,
	type TProductGroup,
	type TRegistrationNumber,
	type TSortOption
} from './types';

export * from 'feature-fetch';
export * from './create-eprel-client';
export * from './types';
export * from './with-eprel';

declare module 'feature-fetch' {
	interface TThirdPartyFeatures<GPaths> {
		eprel: {
			getProductGroups(): Promise<components['schemas']['ProductGroupList']>;

			getModelsInProductGroup(
				productGroup: TProductGroup,
				options?: {
					page?: number;
					limit?: number;
					// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100870
					sort?: TSortOption[];
					// https://webgate.ec.europa.eu/fpfis/wikis/pages/viewpage.action?pageId=1847100863
					filter?: Record<string, string>;
					includeOldProducts?: boolean;
				}
			): Promise<components['schemas']['ModelsList']>;

			getProductByRegistrationNumber(
				registrationNumber: TRegistrationNumber
			): Promise<components['schemas']['ModelDetails']>;

			getProductFiches<
				GOptions extends {
					noRedirect?: boolean;
					language?: TLanguage;
				}
			>(
				registrationNumber: TRegistrationNumber,
				options?: GOptions
			): Promise<TReturnType<GOptions>>;

			getProductLabels<
				GOptions extends {
					noRedirect?: boolean;
					format?: TLabelFormat;
					instance?: number;
					supplierLabel?: boolean;
					type?: TLabelType;
				}
			>(
				registrationNumber: TRegistrationNumber,
				options?: GOptions
			): Promise<TReturnType<GOptions>>;

			getNestedLabel(registrationNumber: TRegistrationNumber): Promise<Uint8Array>;

			exportProductGroupModels(productGroup: TProductGroup): Promise<Uint8Array>;
		};
	}
}

type TReturnType<GOptions> = GOptions extends { noRedirect?: boolean }
	? GOptions['noRedirect'] extends true
		? TFileAddress
		: Uint8Array
	: Uint8Array;
