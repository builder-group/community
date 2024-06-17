import { TFormFieldStateFeature, TFormFielStatusStateFeature, TFormStateFeature } from './types';

export * from './create-form';
export * from './types';

declare module 'feature-state' {
	interface TThirdPartyFeatures<GValue> {
		// @ts-expect-error - Form feature can only be used with specific value type
		'form': TFormStateFeature<GValue>;
		'form-field': TFormFieldStateFeature<GValue>;
		'form-field-status': TFormFielStatusStateFeature;
	}
}
