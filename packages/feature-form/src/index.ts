import type {
	TFormFieldStateFeature,
	TFormFielStatusStateFeature,
	TFormStateFeature
} from './types';

export * from './create-form';
export * from './types';

declare module 'feature-state' {
	interface TThirdPartyFeatures<GValue> {
		'form': TFormStateFeature<GValue>;
		'form-field': TFormFieldStateFeature<GValue>;
		'form-field-status': TFormFielStatusStateFeature;
	}
}
