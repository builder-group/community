import { TFeatureDefinition } from '@blgc/types/features';
import {
	type TForm,
	type TFormData,
	type TFormField,
	type TFormFieldStatus,
	type TSubmitOptions
} from 'feature-form';
import React from 'react';
import { registerFormField, type TRegisterFormFieldResponse } from '../register-form-field';

export function useForm<GFormData extends TFormData, GFeatures extends TFeatureDefinition[]>(
	form: TForm<GFormData, GFeatures>
): TUseFormResponse<GFormData, GFeatures> {
	const [, forceRender] = React.useReducer((s: number) => s + 1, 0);

	React.useEffect(() => {
		const unbindCallbacks: (() => void)[] = [];
		for (const formField of Object.values(form.fields) as TFormField<unknown>[]) {
			const unbind = formField.listen(
				({ background }) => {
					if (!background) {
						forceRender();
					}
				},
				{ key: 'use-form' }
			);
			unbindCallbacks.push(unbind);
		}
		return () => {
			unbindCallbacks.forEach((callback) => {
				callback();
			});
		};
	}, [form.fields]);

	return {
		register<GKey extends keyof GFormData>(formFieldKey: GKey, controlled = false) {
			return registerFormField<GFormData[GKey], GKey>(form.getField(formFieldKey), controlled);
		},
		handleSubmit: (options = {}) => {
			const { preventDefault = true, ...submitOptions } = options;
			return (event?: React.BaseSyntheticEvent) => {
				if (preventDefault) {
					event?.preventDefault();
				}

				if (submitOptions.additionalData != null) {
					submitOptions.additionalData.event = event;
				} else {
					submitOptions.additionalData = { event };
				}

				return form.submit(submitOptions);
			};
		},
		field(formFieldKey) {
			return form.getField(formFieldKey);
		},
		status(formFieldKey) {
			return form.getField(formFieldKey).status;
		}
	};
}

export interface TUseFormResponse<
	GFormData extends TFormData,
	GFeatures extends TFeatureDefinition[]
> {
	handleSubmit: (
		options?: THandleSubmitOptions<GFormData, GFeatures>
	) => (event?: React.BaseSyntheticEvent) => Promise<boolean>;
	register: <GKey extends keyof GFormData>(
		formFieldKey: GKey,
		controlled?: boolean
	) => TRegisterFormFieldResponse<GKey, GFormData[GKey]>;
	field: <GKey extends keyof GFormData>(formFieldKey: GKey) => TFormField<GFormData[GKey]>;
	status: <GKey extends keyof GFormData>(formFieldKey: GKey) => TFormFieldStatus;
}

interface THandleSubmitOptions<GFormData extends TFormData, GFeatures extends TFeatureDefinition[]>
	extends TSubmitOptions<GFormData, GFeatures> {
	preventDefault?: boolean;
}
