import { hasProperty } from '@blgc/utils';
import { type TFormField } from 'feature-form';
import { type ChangeEventHandler, type FocusEventHandler } from 'react';

export function registerFormField<GValue, GKey = string>(
	formField: TFormField<GValue>,
	controlled?: boolean
): TRegisterFormFieldResponse<GKey, GValue> {
	return {
		name: formField.key,
		...(controlled ? { value: formField._v } : { defaultValue: formField._intialValue }),
		onBlur: () => {
			formField.blur();
		},
		onChange(event) {
			if (hasProperty(event.target, 'value')) {
				formField.set(event.target.value as any, {
					listenerContext: {
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
