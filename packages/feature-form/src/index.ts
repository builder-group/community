import type { TFormFieldStateFeature, TFormFielStatusStateFeature } from './types';

export { BitwiseFlag, bitwiseFlag } from '@blgc/utils';
export { createValidator } from 'validation-adapter';
export * from './create-form';
export * from './form-field';
export * from './helper';
export * from './types';

declare module 'feature-state' {
	interface TThirdPartyFeatures<GValue> {
		'form-field': TFormFieldStateFeature<GValue>;
		'form-field-status': TFormFielStatusStateFeature;
	}
}
