import { type components } from './gen/v1';

export type TProductGroup = components['parameters']['ProductGroup'];
export type TRegistrationNumber = components['parameters']['RegistrationNumber'];
export type TLanguage = components['parameters']['Language'];
export type TLabelFormat = components['parameters']['LabelFormat'];
export type TLabelType = components['parameters']['LabelType'];
export type TFileAddress = components['schemas']['FileAddress'];

export interface TSortOption {
	field: string;
	order: 'ASC' | 'DESC';
}
