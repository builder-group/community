import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createForm } from '../create-form';
import type { TForm } from '../types';
import { dirtyFeature, type TDirtyFeature, type TDirtyFields } from './dirty';

describe('dirtyFeature function', () => {
	it('should have correct types', () => {
		const form = createForm<TUserFormData>({
			fields: {
				name: { defaultValue: 'Alice' },
				email: { defaultValue: 'alice@example.com' }
			}
		}).with(dirtyFeature<TUserFormData>());

		expectTypeOf(form).toEqualTypeOf<TForm<TUserFormData, [TDirtyFeature<TUserFormData>]>>();
		expectTypeOf(form.isDirty.get()).toEqualTypeOf<boolean>();
		expectTypeOf(form.dirtyFields.get()).toEqualTypeOf<TDirtyFields<TUserFormData>>();
		expectTypeOf(form.submit).toEqualTypeOf<TForm<TUserFormData>['submit']>();
	});

	it('should track dirty fields', () => {
		// Prepare
		const form = createForm<TUserFormData>({
			fields: {
				name: { defaultValue: 'Alice' },
				email: { defaultValue: 'alice@example.com' }
			}
		}).with(dirtyFeature<TUserFormData>());

		// Act
		form.fields.name.set('Bob');

		// Assert
		expect(form.isDirty.get()).toBe(true);
		expect(form.dirtyFields.get()).toEqual({
			name: true,
			email: false
		});
	});

	it('should reset dirty baseline to current values', () => {
		// Prepare
		const form = createForm<TUserFormData>({
			fields: {
				name: { defaultValue: 'Alice' },
				email: { defaultValue: 'alice@example.com' }
			}
		}).with(dirtyFeature<TUserFormData>());
		form.fields.name.set('Bob');

		// Act
		form.resetDirty();
		form.fields.name.set('Alice');

		// Assert
		expect(form.isDirty.get()).toBe(true);
		expect(form.dirtyFields.get().name).toBe(true);
		form.reset();
		expect(form.fields.name.get()).toBe('Bob');
		expect(form.isDirty.get()).toBe(false);
	});

	it('should clear dirty state when submit updates default values', async () => {
		// Prepare
		const form = createForm<TUserFormData>({
			fields: {
				name: {
					defaultValue: 'Alice',
					validator: createStandardSchema<string>((value) =>
						value.length > 0 ? { value } : { issues: [{ message: 'Required' }] }
					)
				},
				email: { defaultValue: 'alice@example.com' }
			}
		}).with(dirtyFeature<TUserFormData>());
		form.fields.name.set('Bob');

		// Act
		const isValid = await form.submit({ updateDefaultValues: true });

		// Assert
		expect(isValid).toBe(true);
		expect(form.isDirty.get()).toBe(false);
		expect(form.dirtyFields.get()).toEqual({
			name: false,
			email: false
		});
	});

	it('should compare plain objects structurally by default', () => {
		// Prepare
		const form = createForm<TProfileFormData>({
			fields: {
				profile: { defaultValue: { name: 'Alice' } }
			}
		}).with(dirtyFeature<TProfileFormData>());

		// Act
		form.fields.profile.set({ name: 'Alice' });

		// Assert
		expect(form.isDirty.get()).toBe(false);
		expect(form.dirtyFields.get().profile).toBe(false);
	});
});

interface TUserFormData {
	name: string;
	email: string;
}

interface TProfileFormData {
	profile: {
		name: string;
	};
}

function createStandardSchema<GValue>(
	validate: (value: GValue) => StandardSchemaV1.Result<GValue>
): StandardSchemaV1<GValue> {
	return {
		'~standard': {
			version: 1,
			vendor: 'feature-form-test',
			validate(value) {
				return validate(value as GValue);
			}
		}
	};
}
