import { type TFormField } from 'feature-form';
import { type ChangeEventHandler, type FocusEventHandler } from 'react';
import { type TIsWideString } from './types';

/**
 * Returns props for binding a native input, textarea, or select to a form field.
 * Non-string fields require explicit parse and format functions.
 */
export function getFieldInputProps<GKey extends string = string, GValue = string>(
	formField: TFormField<GValue>,
	...[options]: TFieldInputOptionsArgs<GValue>
): TFieldInputProps<GKey> {
	const {
		controlled = false,
		format,
		parse
	} = (options as TAnyFieldInputOptions<GValue> | undefined) ?? {};
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

export type TFieldInputOptionsArgs<GValue> =
	TIsWideString<GValue> extends true
		? [options?: TStringFieldInputOptions<GValue>]
		: [options: TParsedFieldInputOptions<GValue>];

export interface TStringFieldInputOptions<GValue> {
	controlled?: boolean;
	format?: (value: GValue) => string | undefined;
	parse?: (value: string) => GValue;
}

export interface TParsedFieldInputOptions<GValue> {
	controlled?: boolean;
	format: (value: GValue) => string | undefined;
	parse: (value: string) => GValue;
}

type TAnyFieldInputOptions<GValue> =
	| TStringFieldInputOptions<GValue>
	| TParsedFieldInputOptions<GValue>;

type TFieldInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
