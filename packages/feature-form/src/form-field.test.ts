import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createFormField, isFormField } from './form-field';
import type { TFormField } from './types';

describe('createFormField function', () => {
	it('should have correct types', () => {
		const field = createFormField('Alice', {
			key: 'name',
			validator: createStandardSchema<string>((value) => ({ value }))
		});

		expectTypeOf(field).toEqualTypeOf<TFormField<string>>();
		expectTypeOf(field.get()).toEqualTypeOf<string>();
		expectTypeOf(field.defaultValue).toEqualTypeOf<string>();
		expectTypeOf(field.validate()).toEqualTypeOf<Promise<boolean>>();
		expectTypeOf(field.onBlur)
			.parameter(0)
			.toEqualTypeOf<(context: { wasTouched: boolean }) => void>();
	});

	it('should create a form field state with field metadata', () => {
		// Prepare
		const field = createFormField('Alice', { key: 'name' });

		// Act
		field.set('Bob');

		// Assert
		expect(isFormField(field)).toBe(true);
		expect(field.key).toBe('name');
		expect(field.defaultValue).toBe('Alice');
		expect(field.get()).toBe('Bob');
		expect(field.status.get()).toEqual({ type: 'valid' });
	});

	it('should validate the current value', async () => {
		// Prepare
		const field = createFormField('', {
			key: 'name',
			validator: createStandardSchema<string>((value) =>
				value.length > 0 ? { value } : { issues: [{ message: 'Required' }] }
			)
		});

		// Act
		const isValid = await field.validate();

		// Assert
		expect(isValid).toBe(false);
		expect(field.status.get()).toEqual({
			type: 'invalid',
			errors: [{ message: 'Required', path: undefined }]
		});
	});

	it('should validate on change when configured', async () => {
		// Prepare
		const field = createFormField('Alice', {
			key: 'name',
			validateOn: ['change'],
			validator: createStandardSchema<string>((value) =>
				value.length > 0 ? { value } : { issues: [{ message: 'Required' }] }
			)
		});

		// Act
		field.set('');
		await waitForQueuedValidation();

		// Assert
		expect(field.status.get()).toEqual({
			type: 'invalid',
			errors: [{ message: 'Required', path: undefined }]
		});
	});

	it('should not notify status listeners when validation returns the same status', async () => {
		// Prepare
		const field = createFormField('', {
			key: 'name',
			validateOn: ['change'],
			validator: createStandardSchema<string>(() => ({ issues: [{ message: 'Required' }] }))
		});
		await field.validate();
		let statusChangeCount = 0;
		field.status.listen(() => {
			statusChangeCount++;
		});

		// Act
		field.set('A');
		await waitForQueuedValidation();

		// Assert
		expect(statusChangeCount).toBe(0);
	});

	it('should validate on first blur when touched is configured', async () => {
		// Prepare
		let validationCount = 0;
		const field = createFormField('', {
			key: 'name',
			validateOn: ['touched'],
			validator: createStandardSchema<string>((value) => {
				validationCount++;
				return value.length > 0 ? { value } : { issues: [{ message: 'Required' }] };
			})
		});

		// Act
		field.blur();
		await waitForQueuedValidation();
		field.blur();
		await waitForQueuedValidation();

		// Assert
		expect(field.isTouched.get()).toBe(true);
		expect(validationCount).toBe(1);
		expect(field.status.get()).toEqual({
			type: 'invalid',
			errors: [{ message: 'Required', path: undefined }]
		});
	});

	it('should notify blur callbacks with the previous touched state', () => {
		// Prepare
		const field = createFormField('', { key: 'name' });
		const wasTouchedValues: boolean[] = [];
		field.onBlur(({ wasTouched }) => {
			wasTouchedValues.push(wasTouched);
		});

		// Act
		field.blur();
		field.blur();

		// Assert
		expect(wasTouchedValues).toEqual([false, true]);
	});

	it('should reset value and lifecycle state', async () => {
		// Prepare
		const field = createFormField('', {
			key: 'name',
			validateOn: ['blur'],
			validator: createStandardSchema<string>(() => ({ issues: [{ message: 'Required' }] }))
		});
		field.set('Bob');
		field.blur();
		await waitForQueuedValidation();

		// Act
		field.reset();

		// Assert
		expect(field.get()).toBe('');
		expect(field.isTouched.get()).toBe(false);
		expect(field.isSubmitted.get()).toBe(false);
		expect(field.isValidating.get()).toBe(false);
		expect(field.status.get()).toEqual({ type: 'unvalidated' });
	});
});

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

// Listener-triggered validation is fire-and-forget and crosses two async function continuations
async function waitForQueuedValidation(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}
