import { TFormFieldStateFeature, TFormFielStatusStateFeature } from './types';

export * from './create-form';
export * from './types';

declare module 'feature-state' {
	interface TThirdPartyFeatures<GValue> {
		'form-field': TFormFieldStateFeature<GValue>;
		'form-field-status': TFormFielStatusStateFeature;
	}
}
