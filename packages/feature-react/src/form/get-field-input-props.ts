import { type TFormField } from 'feature-form';
import { type ChangeEventHandler, type FocusEventHandler } from 'react';
import { type TIsWideString } from './types';

/**
 * Returns `name`, `defaultValue`/`value`, `onChange`, and `onBlur` props for binding
 * a native input, textarea, or select to a form field.
 *
 * Uncontrolled by default: `onChange` sets the field value with `background: true` so React
 * does not re-render on every keystroke. Set `controlled: true` for a controlled input.
 * Non-string fields require `format` (field value to display string) and `parse` (string to field value).
 */
export function getFieldInputProps<GKey extends string = string, GValue = string>(
	formField: TFormField<GValue>,
	...[options]: TFieldInputOptionsArgs<GValue>
): TFieldInputProps<GKey> {
	const { controlled = false, format, parse } = options ?? {};
	const value = format == null ? (formField.get() as string | undefined) : format(formField.get());

	return {
		name: formField.key as GKey,
		...(controlled ? { value } : { defaultValue: value }),
		onBlur: () => {
			formField.blur();
		},
		onChange(event) {
			const nextValue =
				parse == null ? (event.currentTarget.value as GValue) : parse(event.currentTarget.value);

			formField.set(nextValue, {
				listenerContext: {
					background: !controlled
				}
			});
		}
	};
}

export interface TFieldInputProps<GKey extends string> {
	defaultValue?: string;
	value?: string;
	name: GKey;
	onChange: ChangeEventHandler<TFieldInputElement>;
	onBlur: FocusEventHandler<TFieldInputElement>;
}

/** Requires `format` and `parse` for non-string field values. */
export type TFieldInputOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options?: TFieldInputOptions<GValue>]
		: [options: TParsedFieldInputOptions<GValue>];

export interface TFieldInputOptions<GValue> {
	/** Use a controlled input. Defaults to `false`. */
	controlled?: boolean;
	/** Converts the field value to a display string. */
	format?: (value: GValue) => string | undefined;
	/** Converts the input string back to the field value type. */
	parse?: (value: string) => GValue;
}

export interface TParsedFieldInputOptions<GValue> {
	/** Use a controlled input. Defaults to `false`. */
	controlled?: boolean;
	/** Converts the field value to a display string. */
	format: (value: GValue) => string | undefined;
	/** Converts the input string back to the field value type. */
	parse: (value: string) => GValue;
}

type TFieldInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
