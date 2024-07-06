import type { TFormFieldStateFeature, TFormFielStatusStateFeature } from './types';

export { BitwiseFlag, bitwiseFlag } from '@ibg/utils';
export { createValidationAdapter } from 'validation-adapter';
export * from './create-form';
export * from './form-field';
export * from './types';

declare module 'feature-state' {
	interface TThirdPartyFeatures<GValue> {
		'form-field': TFormFieldStateFeature<GValue>;
		'form-field-status': TFormFielStatusStateFeature;
	}
}
