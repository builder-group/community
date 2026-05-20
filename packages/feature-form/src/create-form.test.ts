import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { createForm } from './create-form';

describe('createForm function', () => {
	it('should create form fields and return current data', () => {
		// Prepare
		const form = createForm<TUserFormData>({
			fields: {
				name: { defaultValue: 'Alice' },
				email: { defaultValue: 'alice@example.com' }
			}
		});

		// Act
		form.getField('name').set('Bob');

		// Assert
		expect(form.fields.name).toBe(form.getField('name'));
		expect(form.getData()).toEqual({
			name: 'Bob',
			email: 'alice@example.com'
		});
		expect(form.getValidData()).toEqual({
			name: 'Bob',
			email: 'alice@example.com'
		});
		expect(form.status.get()).toEqual({ type: 'valid' });
	});

	describe('submit method', () => {
		it('should submit valid data and update default values when configured', async () => {
			// Prepare
			const submittedData: Array<Readonly<TUserFormData>> = [];
			const form = createForm<TUserFormData>({
				fields: {
					name: {
						defaultValue: '',
						validator: createStandardSchema<string>((value) =>
							value.length > 0 ? { value } : { issues: [{ message: 'Required' }] }
						)
					},
					email: { defaultValue: 'alice@example.com' }
				},
				onValidSubmit(data) {
					submittedData.push(data);
				}
			});
			form.fields.name.set('Bob');

			// Act
			const isValid = await form.submit({ updateDefaultValues: true });
			form.fields.name.set('Charlie');
			form.reset();

			// Assert
			expect(isValid).toBe(true);
			expect(submittedData).toEqual([{ name: 'Bob', email: 'alice@example.com' }]);
			expect(form.fields.name.get()).toBe('Bob');
			expect(form.isSubmitted.get()).toBe(false);
		});

		it('should submit invalid field errors with local and aggregate paths', async () => {
			// Prepare
			interface TScheduleFormData {
				conditions: Array<{ timeOfDayMs?: number }>;
			}
			const invalidSubmissions: unknown[] = [];
			const form = createForm<TScheduleFormData>({
				fields: {
					conditions: {
						defaultValue: [{ timeOfDayMs: undefined }],
						validator: createStandardSchema<Array<{ timeOfDayMs?: number }>>(() => ({
							issues: [
								{
									message: 'Required',
									path: [0, 'timeOfDayMs']
								}
							]
						}))
					}
				},
				onInvalidSubmit(errors) {
					invalidSubmissions.push(errors);
				}
			});

			// Act
			const isValid = await form.submit();

			// Assert
			expect(isValid).toBe(false);
			expect(form.getErrors().fields.conditions).toEqual([
				{ message: 'Required', path: [0, 'timeOfDayMs'] }
			]);
			expect(form.status.get()).toEqual({
				type: 'invalid',
				errors: [{ message: 'Required', path: [0, 'timeOfDayMs'] }]
			});
			expect(invalidSubmissions).toHaveLength(1);
			expect(form.isSubmitted.get()).toBe(true);
		});

		it('should respect submit validation triggers', async () => {
			// Prepare
			let validationCount = 0;
			const form = createForm<TUserFormData>({
				fields: {
					name: {
						defaultValue: '',
						validateOn: ['blur'],
						revalidateOn: ['blur'],
						validator: createStandardSchema<string>((value) => {
							validationCount++;
							return value.length > 0 ? { value } : { issues: [{ message: 'Required' }] };
						})
					},
					email: { defaultValue: 'alice@example.com' }
				}
			});

			// Act
			const isValid = await form.submit();

			// Assert
			expect(isValid).toBe(false);
			expect(validationCount).toBe(0);
			expect(form.status.get()).toEqual({ type: 'unvalidated' });
		});

		it('should revalidate on submit by default', async () => {
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
			});
			await form.submit();
			form.fields.name.set('');

			// Act
			const isValid = await form.submit();

			// Assert
			expect(isValid).toBe(false);
			expect(form.getErrors().fields.name).toEqual([{ message: 'Required', path: undefined }]);
		});
	});

	describe('validation', () => {
		it('should validate form-level constraints', async () => {
			// Prepare
			interface TPasswordFormData {
				password: string;
				confirm: string;
			}
			const form = createForm<TPasswordFormData>({
				fields: {
					password: { defaultValue: 'secret' },
					confirm: { defaultValue: 'different' }
				},
				validation: {
					validator: createStandardSchema<TPasswordFormData>((value) =>
						value.password === value.confirm
							? { value }
							: { issues: [{ message: 'Passwords do not match', path: ['confirm'] }] }
					)
				}
			});

			// Act
			const isValid = await form.validate();

			// Assert
			expect(isValid).toBe(false);
			expect(form.getErrors().form).toEqual([
				{ message: 'Passwords do not match', path: ['confirm'] }
			]);
			expect(form.status.get()).toEqual({
				type: 'invalid',
				errors: [{ message: 'Passwords do not match', path: ['confirm'] }]
			});
		});

		it('should validate form-level constraints on field change when configured', async () => {
			// Prepare
			const form = createForm<TUserFormData>({
				fields: {
					name: { defaultValue: '' },
					email: { defaultValue: 'alice@example.com' }
				},
				validation: {
					validateOn: ['change'],
					validator: createStandardSchema<TUserFormData>((value) =>
						value.name.length > 0
							? { value }
							: { issues: [{ message: 'Name required', path: ['name'] }] }
					)
				}
			});

			// Act
			form.fields.name.set('Bob');
			await waitForQueuedValidation();
			form.fields.name.set('');
			await waitForQueuedValidation();

			// Assert
			expect(form.status.get()).toEqual({
				type: 'invalid',
				errors: [{ message: 'Name required', path: ['name'] }]
			});
		});
	});

	describe('callbacks', () => {
		it('should register and unregister submit callbacks', async () => {
			// Prepare
			const submittedData: Array<Readonly<TUserFormData>> = [];
			const form = createForm<TUserFormData>({
				fields: {
					name: { defaultValue: 'Alice' },
					email: { defaultValue: 'alice@example.com' }
				}
			});
			const unbind = form.onValidSubmit((data) => {
				submittedData.push(data);
			});

			// Act
			await form.submit();
			unbind();
			form.fields.name.set('Bob');
			await form.submit();

			// Assert
			expect(submittedData).toEqual([{ name: 'Alice', email: 'alice@example.com' }]);
		});
	});

	describe('reset method', () => {
		it('should reset field values and validation status', async () => {
			// Prepare
			const form = createForm<TUserFormData>({
				fields: {
					name: {
						defaultValue: '',
						validator: createStandardSchema<string>(() => ({
							issues: [{ message: 'Required' }]
						}))
					},
					email: { defaultValue: 'alice@example.com' }
				}
			});
			form.fields.name.set('Bob');
			await form.validate();

			// Act
			form.reset();

			// Assert
			expect(form.getData()).toEqual({
				name: '',
				email: 'alice@example.com'
			});
			expect(form.status.get()).toEqual({ type: 'unvalidated' });
			expect(form.getErrors()).toEqual({ fields: {}, form: [] });
		});
	});
});

interface TUserFormData {
	name: string;
	email: string;
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

// Listener-triggered validation is fire-and-forget and crosses async function continuations
async function waitForQueuedValidation(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}
