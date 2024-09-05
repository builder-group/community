import { type components } from './gen/v1';

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
