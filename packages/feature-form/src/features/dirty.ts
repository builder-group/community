import { defineFeature, type TFeature } from 'feature-core';
import { createState, type TState } from 'feature-state';
import { deepCopy } from '../lib';
import { type TForm, type TFormData, type TFormFieldKey, type TFormFields } from '../types';

export function dirtyFeature<GFormData extends TFormData = TFormData>(
	config: TDirtyFeatureConfig = {}
): TDirtyFeature<GFormData> {
	const { isEqual = isDeepEqual } = config;

	return defineFeature<TDirtyFeature<GFormData>>({
		key: 'dirty',
		overrides: ['submit'],
		install(form: TForm<GFormData, []>) {
			const dirtyFields = createState<TDirtyFields<GFormData>>(getDirtyFields(form, isEqual));
			const isDirty = createState(isFormDirty(dirtyFields.get()));
			const updateDirtyState = (): void => {
				const nextDirtyFields = getDirtyFields(form, isEqual);
				if (!areDirtyFieldsEqual(dirtyFields.get(), nextDirtyFields)) {
					dirtyFields.set(nextDirtyFields);
				}
				isDirty.set(isFormDirty(nextDirtyFields));
			};
			const submit = form.submit.bind(form);

			for (const formField of getFormFields(form.fields)) {
				formField.listen(updateDirtyState);
			}

			return {
				isDirty,
				dirtyFields,
				resetDirty() {
					for (const formField of getFormFields(form.fields)) {
						formField.defaultValue = deepCopy(formField.get());
					}
					updateDirtyState();
				},
				async submit(options) {
					try {
						return await submit(options);
					} finally {
						updateDirtyState();
					}
				}
			};
		}
	});
}

export interface TDirtyFeatureConfig {
	isEqual?: TDirtyFieldComparator;
}

export type TDirtyFieldComparator = (value: unknown, defaultValue: unknown) => boolean;

export type TDirtyFeature<GFormData extends TFormData = TFormData> = TFeature<
	'dirty',
	{
		isDirty: TState<boolean, []>;
		dirtyFields: TState<TDirtyFields<GFormData>, []>;
		resetDirty(): void;
		submit: TForm<GFormData, []>['submit'];
	},
	[],
	'submit'
>;

export type TDirtyFields<GFormData extends TFormData> = {
	[Key in TFormFieldKey<GFormData>]: boolean;
};

function getDirtyFields<GFormData extends TFormData>(
	form: TForm<GFormData, []>,
	isEqual: TDirtyFieldComparator
): TDirtyFields<GFormData> {
	return Object.fromEntries(
		getFormFieldEntries(form.fields).map(([fieldKey, formField]) => [
			fieldKey,
			!isEqual(formField.get(), formField.defaultValue)
		])
	) as TDirtyFields<GFormData>;
}

function isFormDirty<GFormData extends TFormData>(dirtyFields: TDirtyFields<GFormData>): boolean {
	return Object.values(dirtyFields).some((isFieldDirty) => isFieldDirty);
}

function areDirtyFieldsEqual<GFormData extends TFormData>(
	current: TDirtyFields<GFormData>,
	next: TDirtyFields<GFormData>
): boolean {
	for (const fieldKey of Object.keys(next) as Array<TFormFieldKey<GFormData>>) {
		if (current[fieldKey] !== next[fieldKey]) {
			return false;
		}
	}

	return true;
}

function isDeepEqual(value: unknown, defaultValue: unknown): boolean {
	if (Object.is(value, defaultValue)) {
		return true;
	}

	if (Array.isArray(value) && Array.isArray(defaultValue)) {
		if (value.length !== defaultValue.length) {
			return false;
		}

		return value.every((item, index) => isDeepEqual(item, defaultValue[index]));
	}

	if (!isPlainObject(value) || !isPlainObject(defaultValue)) {
		return false;
	}

	const valueKeys = Object.keys(value);
	const defaultValueKeys = Object.keys(defaultValue);
	if (valueKeys.length !== defaultValueKeys.length) {
		return false;
	}

	return valueKeys.every(
		(key) => key in defaultValue && isDeepEqual(value[key], defaultValue[key])
	);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return (
		typeof value === 'object' && value != null && Object.getPrototypeOf(value) === Object.prototype
	);
}

function getFormFields<GFormData extends TFormData>(
	fields: TFormFields<GFormData>
): Array<TFormFields<GFormData>[TFormFieldKey<GFormData>]> {
	return Object.values(fields) as Array<TFormFields<GFormData>[TFormFieldKey<GFormData>]>;
}

function getFormFieldEntries<GFormData extends TFormData>(
	fields: TFormFields<GFormData>
): Array<[TFormFieldKey<GFormData>, TFormFields<GFormData>[TFormFieldKey<GFormData>]]> {
	return Object.entries(fields) as Array<
		[TFormFieldKey<GFormData>, TFormFields<GFormData>[TFormFieldKey<GFormData>]]
	>;
}
