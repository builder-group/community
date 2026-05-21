import { type TAnyFeature } from 'feature-core';
import {
	type TForm,
	type TFormData,
	type TFormField,
	type TFormFieldKey,
	type TFormFieldStatus,
	type TFormSubmitOptions
} from 'feature-form';
import React from 'react';
import {
	getFieldInputProps,
	type TFieldInputOptionsArgs,
	type TFieldInputProps
} from '../get-field-input-props';

/**
 * Subscribes to a form and re-renders the component when any field changes.
 */
export function useForm<GFormData extends TFormData, GFeatures extends TAnyFeature[]>(
	form: TForm<GFormData, GFeatures>
): TUseFormResponse<GFormData, GFeatures> {
	const [, forceRender] = React.useReducer((value: number) => value + 1, 0);

	// Note: useEffect is intentional here; useForm subscribes to multiple field sources
	// which makes useSyncExternalStore impractical. Post-paint timing is fine for forms.
	React.useEffect(() => {
		const unbinds: Array<() => void> = [];
		for (const formField of Object.values(form.fields) as TFormField<unknown>[]) {
			unbinds.push(
				formField.listen(({ background }) => {
					if (background !== true) {
						forceRender();
					}
				})
			);
		}

		return () => {
			for (const unbind of unbinds) {
				unbind();
			}
		};
	}, [form]);

	return {
		form,
		input<GKey extends TFormFieldKey<GFormData>>(
			formFieldKey: GKey,
			...[options]: TFieldInputOptionsArgs<GFormData[GKey]>
		) {
			return getFieldInputProps<GKey, GFormData[GKey]>(
				form.getField(formFieldKey),
				// Note: Options must be re-spread as a tuple because TypeScript cannot forward
				// conditional rest params directly; the conditional spread preserves the required/optional distinction.
				...((options == null ? [] : [options]) as TFieldInputOptionsArgs<GFormData[GKey]>)
			);
		},
		handleSubmit: (options = {}) => {
			const { context, preventDefault = true, ...submitOptions } = options;
			return (event?: React.BaseSyntheticEvent) => {
				if (preventDefault) {
					event?.preventDefault();
				}

				return form.submit({
					...submitOptions,
					context: {
						...context,
						event
					}
				});
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

export interface TUseFormResponse<GFormData extends TFormData, GFeatures extends TAnyFeature[]> {
	form: TForm<GFormData, GFeatures>;
	handleSubmit: (
		options?: THandleSubmitOptions<GFormData>
	) => (event?: React.BaseSyntheticEvent) => Promise<boolean>;
	input: <GKey extends TFormFieldKey<GFormData>>(
		formFieldKey: GKey,
		...options: TFieldInputOptionsArgs<GFormData[GKey]>
	) => TFieldInputProps<GKey>;
	field: <GKey extends TFormFieldKey<GFormData>>(formFieldKey: GKey) => TFormField<GFormData[GKey]>;
	status: <GKey extends TFormFieldKey<GFormData>>(formFieldKey: GKey) => TFormFieldStatus;
}

interface THandleSubmitOptions<GFormData extends TFormData> extends TFormSubmitOptions<GFormData> {
	preventDefault?: boolean;
}
