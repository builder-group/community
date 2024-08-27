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
					sort?: TSortOption[];
					includeOldProducts?: boolean;
				}
			): Promise<components['schemas']['ModelsList']>;

			getProductByRegistrationNumber(
				registrationNumber: TRegistrationNumber
			): Promise<components['schemas']['ModelDetails']>;

			getProductFiche(
				registrationNumber: TRegistrationNumber,
				options?: {
					noRedirect?: boolean;
					language?: TLanguage;
				}
			): Promise<TFileAddress | Uint8Array>;

			getProductLabel(
				registrationNumber: TRegistrationNumber,
				options?: {
					noRedirect?: boolean;
					format?: TLabelFormat;
					instance?: number;
					supplier_label?: boolean;
					type?: TLabelType;
				}
			): Promise<TFileAddress | Uint8Array>;

			getNestedLabel(registrationNumber: TRegistrationNumber): Promise<Uint8Array>;

			exportProductGroupModels(productGroup: TProductGroup): Promise<Uint8Array>;
		};
	}
}
