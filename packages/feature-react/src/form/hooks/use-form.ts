import { type TForm, type TFormData, type TFormField, type TFormFieldStatus } from 'feature-form';
import React, { type ChangeEventHandler, type FocusEventHandler } from 'react';
import { hasProperty } from '@ibg/utils';

export function useForm<GFormData extends TFormData>(
	form: TForm<GFormData, ['base']>
): TUseFormResponse<GFormData> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbindCallbacks: (() => void)[] = [];
		for (const formField of Object.values(form.fields) as TFormField<unknown>[]) {
			const unbind = formField.listen(() => {
				forceRender();
			});
			unbindCallbacks.push(unbind);
		}
		return () => {
			unbindCallbacks.forEach((callback) => {
				callback();
			});
		};
	}, [form.fields]);

	return {
		register(formFieldKey, controlled = false) {
			const formField = form.getField(formFieldKey);

			return {
				name: formField.key,
				defaultValue: formField._intialValue,
				value: controlled ? formField._value : undefined,
				onBlur: formField.blur,
				onChange(event) {
					if (hasProperty(event.target, 'value')) {
						formField.set(event.target.value as any, {
							listenerData: {
								background: !controlled
							}
						});
					}
				}
			};
		},
		submit: form.submit,
		field(formFieldKey) {
			return form.getField(formFieldKey);
		},
		status(formFieldKey) {
			return form.getField(formFieldKey).status;
		}
	};
}

export interface TUseFormResponse<GFormData> {
	submit: () => Promise<boolean>;
	register: <GKey extends keyof GFormData>(
		formFieldKey: GKey,
		controlled?: boolean
	) => TRegisterFormFieldResponse<GKey, GFormData[GKey]>;
	field: <GKey extends keyof GFormData>(formFieldKey: GKey) => TFormField<GFormData[GKey]>;
	status: <GKey extends keyof GFormData>(formFieldKey: GKey) => TFormFieldStatus;
}

export interface TRegisterFormFieldResponse<GKey, GValue> {
	defaultValue?: GValue;
	value?: GValue;
	name?: GKey | string;
	onChange?: ChangeEventHandler;
	onBlur?: FocusEventHandler;
}
