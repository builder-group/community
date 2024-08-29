import { type TFormField } from 'feature-form';
import { type ChangeEventHandler, type FocusEventHandler } from 'react';
import { hasProperty } from '@blgc/utils';

export function registerFormField<GValue, GKey = string>(
	formField: TFormField<GValue>,
	controlled?: boolean
): TRegisterFormFieldResponse<GKey, GValue> {
	return {
		name: formField.key,
		defaultValue: formField._intialValue,
		value: controlled ? formField._value : undefined,
		onBlur: () => {
			formField.blur();
		},
		onChange(event) {
			if (hasProperty(event.target, 'value')) {
				formField.set(event.target.value as any, {
					additionalData: {
						background: !controlled
					}
				});
			}
		}
	};
}

export interface TRegisterFormFieldResponse<GKey, GValue> {
	defaultValue?: GValue;
	value?: GValue;
	name?: GKey | string;
	onChange?: ChangeEventHandler;
	onBlur?: FocusEventHandler;
}
