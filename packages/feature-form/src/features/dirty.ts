import { defineFeature, type TFeature } from 'feature-core';
import { createState, type TState } from 'feature-state';
import { deepCopy } from '../lib';
import { type TForm, type TFormData, type TFormFieldKey, type TFormFields } from '../types';

/**
 * Adds `isDirty`, `dirtyFields`, and `resetDirty()` to a form.
 *
 * Tracks whether each field differs from its `defaultValue` using deep structural equality.
 * `isDirty` and `dirtyFields` are reactive states. `resetDirty()` makes the current values
 * the new baseline without clearing them. Dirty state clears automatically when
 * `submit({ updateDefaultValues: true })` succeeds.
 */
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
	/** Custom equality function. Defaults to deep structural equality. */
	isEqual?: TDirtyFieldComparator;
}

/** Returns `true` when a current field value matches its default value. */
export type TDirtyFieldComparator = (value: unknown, defaultValue: unknown) => boolean;

export type TDirtyFeature<GFormData extends TFormData = TFormData> = TFeature<
	'dirty',
	{
		/** True when at least one field differs from its default value. */
		isDirty: TState<boolean, []>;
		/** Field-keyed reactive map where `true` means the field differs from its default value. */
		dirtyFields: TState<TDirtyFields<GFormData>, []>;
		/** Makes the current field values the new default values without clearing the form. */
		resetDirty(): void;
		/** Updates dirty state after the original submit flow completes. */
		submit: TForm<GFormData, []>['submit'];
	},
	[],
	'submit'
>;

/** Field-keyed dirty map where `true` means the field differs from its default value. */
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
