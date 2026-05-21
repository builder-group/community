import { FetchError, TResult } from 'feature-fetch';
import { type components } from './gen/v1';

export interface TEPRELFeature {
	key: 'eprel';
	api: {
		getProductGroups(): Promise<TResult<components['schemas']['ProductGroupList'], FetchError>>;

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
		): Promise<TResult<components['schemas']['ModelsList'], FetchError>>;

		getProductByRegistrationNumber(
			registrationNumber: TRegistrationNumber
		): Promise<TResult<components['schemas']['ModelDetails'] | null, FetchError>>;

		getProductSheets<
			GOptions extends {
				noRedirect?: boolean;
				language?: TSheetLanguage;
			}
		>(
			registrationNumber: TRegistrationNumber,
			options?: GOptions
		): Promise<TResult<TFileAddressReturnType<GOptions>, FetchError>>;

		getProductSheetUrls(
			registrationNumber: TRegistrationNumber
		): Promise<TResult<{ language: TSheetLanguage; url: string }[], FetchError>>;

		getProductSheetUrl(
			registrationNumber: TRegistrationNumber,
			language: TSheetLanguage
		): Promise<TResult<string | null, FetchError>>;

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
		): Promise<TResult<TFileAddressReturnType<GOptions>, FetchError>>;

		getProductLabelUrl(
			registrationNumber: TRegistrationNumber,
			format: TLabelFormat
		): Promise<TResult<string | null, FetchError>>;

		getNestedLabel(
			registrationNumber: TRegistrationNumber
		): Promise<TResult<Uint8Array | null, FetchError>>;

		exportProductGroupModels(
			productGroup: TProductGroup
		): Promise<TResult<Uint8Array | null, FetchError>>;
	};
}

type TFileAddressReturnType<GOptions> = GOptions extends { noRedirect?: boolean }
	? GOptions['noRedirect'] extends true
		? TFileAddress
		: Uint8Array
	: Uint8Array;

export type TProductGroup = components['parameters']['ProductGroup'];
export type TRegistrationNumber = components['parameters']['RegistrationNumber'];
export type TSheetLanguage = components['parameters']['FicheLanguage'];
export type TLabelFormat = components['parameters']['LabelFormat'];
export type TLabelType = components['parameters']['LabelType'];
export type TFileAddress = components['schemas']['FileAddress'];

export type TEnergyClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface TSortOption {
	field: string;
	order: 'ASC' | 'DESC';
}

export const SHEET_LANGUAGES: TSheetLanguage[] = [
	'BG',
	'CS',
	'DA',
	'DE',
	'ET',
	'EL',
	'EN',
	'ES',
	'FR',
	'GA',
	'HR',
	'IT',
	'LV',
	'LT',
	'HU',
	'MT',
	'NL',
	'PL',
	'PT',
	'RO',
	'SK',
	'SL',
	'FI',
	'SV'
];

export const LABEL_FORMATS: TLabelFormat[] = ['PNG', 'SVG', 'PDF'];

export const ENERGY_CLASSES: TEnergyClass[] = ['A', 'B', 'C', 'D', 'E', 'F'];
