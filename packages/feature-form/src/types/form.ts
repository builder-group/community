import { type TFeatureKeys, type TSelectFeatures } from './features';
import { type TFormField, type TFormFieldValidator } from './form-field';

// Note: TForm is not a state because of type issues mainly because GFormData is the main generic,
// but the State value was TFormFields<GFormData>. Thus We had to check if GValue extends TFormFields<infer GFormData>,
// which was unreliable in TypeScript if deeply nested.
export type TForm<GFormData extends TFormData, GSelectedFeatureKeys extends TFeatureKeys[]> = {
	_features: string[];
	_config: TFormConfig<GFormData>;
	fields: TFormFields<GFormData>;
	isValid: boolean;
	isSubmitted: boolean;
	submit: () => Promise<void>;
	revalidate: (cached?: boolean) => Promise<boolean>;
	validate: () => Promise<boolean>;
	getField: <GKey extends keyof TFormFields<GFormData>>(key: GKey) => TFormFields<GFormData>[GKey];
	reset: () => void;
} & TSelectFeatures<GFormData, GSelectedFeatureKeys>;

export type TFormFields<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormField<GFormData[Key]>;
};

export type TFormValidators<GFormData extends TFormData> = {
	[Key in keyof GFormData]: TFormFieldValidator<GFormData[Key]>;
};

export type TFormData = Record<string, unknown>;

export interface TFormConfig<GFormData extends TFormData> {
	/**
	 * Indicates if the form is disabled.
	 */
	disabled: boolean;
	/**
	 * Error collection mode. 'firstError' gathers only the first error per field, 'all' gathers all errors.
	 */
	collectErrorMode: TCollectErrorMode;
	/**
	 * Called once form is submitted
	 */
	onSubmit: ((data: GFormData) => void) | null;
}

export type TCollectErrorMode = 'firstError' | 'all';
