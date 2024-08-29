import { type components } from './gen/v1';

export type TProductGroup = components['parameters']['ProductGroup'];
export type TRegistrationNumber = components['parameters']['RegistrationNumber'];
export type TSheetLanguage = components['parameters']['FicheLanguage'];
export type TLabelFormat = components['parameters']['LabelFormat'];
export type TLabelType = components['parameters']['LabelType'];
export type TFileAddress = components['schemas']['FileAddress'];

export interface TSortOption {
	field: string;
	order: 'ASC' | 'DESC';
}

export const ESheetLanguage: Record<TSheetLanguage, TSheetLanguage> = {
	BG: 'BG',
	CS: 'CS',
	DA: 'DA',
	DE: 'DE',
	ET: 'ET',
	EL: 'EL',
	EN: 'EN',
	ES: 'ES',
	FR: 'FR',
	GA: 'GA',
	HR: 'HR',
	IT: 'IT',
	LV: 'LV',
	LT: 'LT',
	HU: 'HU',
	MT: 'MT',
	NL: 'NL',
	PL: 'PL',
	PT: 'PT',
	RO: 'RO',
	SK: 'SK',
	SL: 'SL',
	FI: 'FI',
	SV: 'SV'
};
