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
 * Subscribes a component to a form and re-renders when any field value changes.
 *
 * Returns `input(key)` to bind a field to a native input, `handleSubmit()` to wire a submit
 * event, `field(key)` to access the raw `TFormField`, and `status(key)` to get a field's
 * status state for a targeted subscription via `useFeatureState`. Use `useFormField` instead
 * for isolated field components or large forms where per-keystroke re-renders are expensive.
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
	/** The form instance passed to the hook. */
	form: TForm<GFormData, GFeatures>;
	/** Returns an event handler that calls `form.submit()`. Prevents the default browser action by default. */
	handleSubmit: (
		options?: THandleSubmitOptions<GFormData>
	) => (event?: React.BaseSyntheticEvent) => Promise<boolean>;
	/** Returns ready-to-spread input props for a field. Calls `getFieldInputProps` under the hood. */
	input: <GKey extends TFormFieldKey<GFormData>>(
		formFieldKey: GKey,
		...options: TFieldInputOptionsArgs<GFormData[GKey]>
	) => TFieldInputProps<GKey>;
	/** Returns the raw `TFormField` for the given key. */
	field: <GKey extends TFormFieldKey<GFormData>>(formFieldKey: GKey) => TFormField<GFormData[GKey]>;
	/** Returns the validation status state for the given field. Pass to `useFeatureState` for a targeted subscription. */
	status: <GKey extends TFormFieldKey<GFormData>>(formFieldKey: GKey) => TFormFieldStatus;
}

interface THandleSubmitOptions<GFormData extends TFormData> extends TFormSubmitOptions<GFormData> {
	/** Calls `event.preventDefault()` before submitting. Defaults to `true`. */
	preventDefault?: boolean;
}
