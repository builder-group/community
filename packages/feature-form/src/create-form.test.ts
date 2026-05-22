import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { createForm } from './create-form';
import { createFormField } from './form-field';
import type { TForm, TFormField } from './types';

describe('createForm function', () => {
	describe('types', () => {
		it('should infer form data from field defaults', () => {
			const form = createForm({
				fields: {
					name: { defaultValue: 'Alice' },
					age: { defaultValue: 42 }
				}
			});

			expectTypeOf(form).toExtend<TForm<{ name: string; age: number }, []>>();
			expectTypeOf(form.fields.name).toExtend<TFormField<string>>();
			expectTypeOf(form.fields.age).toExtend<TFormField<number>>();
			expectTypeOf(form.getData()).toEqualTypeOf<Readonly<{ name: string; age: number }>>();
			expectTypeOf(form.getValidData()).toEqualTypeOf<Readonly<{
				name: string;
				age: number;
			}> | null>();
		});

		it('should infer form data from existing form fields', () => {
			const form = createForm({
				fields: {
					name: createFormField('Alice', { key: 'name' }),
					age: createFormField(42, { key: 'age' })
				}
			});

			expectTypeOf(form).toExtend<TForm<{ name: string; age: number }, []>>();
			expectTypeOf(form.fields.name).toExtend<TFormField<string>>();
			expectTypeOf(form.fields.age).toExtend<TFormField<number>>();
			expectTypeOf(form.getData()).toEqualTypeOf<Readonly<{ name: string; age: number }>>();
		});
	});

	describe('fields', () => {
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
	});

	describe('submit method', () => {
		it('should submit valid data to valid submit callbacks', async () => {
			// Prepare
			const submittedData: Array<Readonly<TUserFormData>> = [];
			const form = createForm<TUserFormData>({
				fields: {
					name: {
						defaultValue: '',
						validator: createRequiredStringSchema()
					},
					email: { defaultValue: 'alice@example.com' }
				},
				onValidSubmit(data) {
					submittedData.push(data);
				}
			});
			form.fields.name.set('Bob');

			// Act
			const isValid = await form.submit();

			// Assert
			expect(isValid).toBe(true);
			expect(submittedData).toEqual([{ name: 'Bob', email: 'alice@example.com' }]);
			expect(form.isSubmitted.get()).toBe(true);
		});

		it('should update default values when configured', async () => {
			// Prepare
			const form = createForm<TUserFormData>({
				fields: {
					name: { defaultValue: 'Alice' },
					email: { defaultValue: 'alice@example.com' }
				}
			});
			form.fields.name.set('Bob');

			// Act
			const isValid = await form.submit({ updateDefaultValues: true });
			form.fields.name.set('Charlie');
			form.reset();

			// Assert
			expect(isValid).toBe(true);
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
						validator: createRequiredStringSchema()
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
		describe('field error routing', () => {
			it('should route form-level field errors to matching fields', async () => {
				// Prepare
				const form = createForm<TPasswordFormData>({
					fields: {
						password: { defaultValue: 'secret' },
						confirm: { defaultValue: 'different' }
					},
					validator: createStandardSchema<TPasswordFormData>((value) =>
						value.password === value.confirm
							? { value }
							: { issues: [{ message: 'Passwords do not match', path: ['confirm'] }] }
					)
				});

				// Act
				const isValid = await form.validate();

				// Assert
				expect(isValid).toBe(false);
				expect(form.getErrors()).toEqual({
					fields: {
						confirm: [{ message: 'Passwords do not match', path: undefined }]
					},
					form: []
				});
			});

			it('should clear routed form-level field errors after the form validator passes', async () => {
				// Prepare
				const form = createForm<TPasswordFormData>({
					fields: {
						password: { defaultValue: 'secret' },
						confirm: { defaultValue: 'different' }
					},
					validator: createStandardSchema<TPasswordFormData>((value) =>
						value.password === value.confirm
							? { value }
							: { issues: [{ message: 'Passwords do not match', path: ['confirm'] }] }
					)
				});
				await form.validate();

				// Act
				form.fields.confirm.set('secret');
				const isValid = await form.validate();

				// Assert
				expect(isValid).toBe(true);
				expect(form.getErrors()).toEqual({ fields: {}, form: [] });
			});

			it('should keep field validator errors when routed form-level errors clear', async () => {
				// Prepare
				const form = createForm<TUserFormData>({
					fields: {
						name: {
							defaultValue: '',
							validator: createRequiredStringSchema('Field required')
						},
						email: { defaultValue: 'invalid@example.com' }
					},
					validator: createStandardSchema<TUserFormData>((value) =>
						value.email === 'alice@example.com'
							? { value }
							: { issues: [{ message: 'Form email error', path: ['name'] }] }
					)
				});
				await form.validate();

				// Act
				form.fields.email.set('alice@example.com');
				await form.validate();

				// Assert
				expect(form.fields.name.status.get()).toEqual({
					type: 'invalid',
					errors: [{ message: 'Field required', path: undefined }]
				});
			});

			it('should keep pathless and unknown form-level errors on the form', async () => {
				// Prepare
				const form = createForm<TUserFormData>({
					fields: {
						name: { defaultValue: '' },
						email: { defaultValue: 'alice@example.com' }
					},
					collectErrorMode: 'all',
					validator: createStandardSchema<TUserFormData>(() => ({
						issues: [
							{ message: 'General form error' },
							{ message: 'Unknown field error', path: ['unknown'] }
						]
					}))
				});

				// Act
				await form.validate();

				// Assert
				expect(form.getErrors()).toEqual({
					fields: {},
					form: [
						{ message: 'General form error', path: undefined },
						{ message: 'Unknown field error', path: ['unknown'] }
					]
				});
			});
		});

		describe('validation triggers', () => {
			it('should validate form-level constraints on field change when configured', async () => {
				// Prepare
				const form = createForm<TUserFormData>({
					fields: {
						name: { defaultValue: '' },
						email: { defaultValue: 'alice@example.com' }
					},
					validateOn: ['change'],
					validator: createStandardSchema<TUserFormData>((value) =>
						value.name.length > 0
							? { value }
							: { issues: [{ message: 'Name required', path: ['name'] }] }
					)
				});

				// Act
				form.fields.name.set('Bob');
				await waitForQueuedValidation();
				form.fields.name.set('');
				await waitForQueuedValidation();

				// Assert
				expect(form.status.get()).toEqual({
					type: 'invalid',
					errors: [{ message: 'Name required', path: undefined }]
				});
			});

			it('should revalidate touched form-level constraints on field change', async () => {
				// Prepare
				const form = createForm<TUserFormData>({
					fields: {
						name: { defaultValue: '' },
						email: { defaultValue: 'alice@example.com' }
					},
					validateOn: ['touched'],
					validator: createStandardSchema<TUserFormData>((value) =>
						value.name.length > 0
							? { value }
							: { issues: [{ message: 'Name required', path: ['name'] }] }
					)
				});

				// Act
				form.fields.name.blur();
				await waitForQueuedValidation();
				form.fields.name.set('Alice');
				await waitForQueuedValidation();

				// Assert
				expect(form.status.get()).toEqual({ type: 'valid' });
				expect(form.getErrors()).toEqual({ fields: {}, form: [] });
			});

			it('should apply form validation defaults to generated fields', async () => {
				// Prepare
				const form = createForm<TUserFormData>({
					fields: {
						name: {
							defaultValue: '',
							validator: createRequiredStringSchema()
						},
						email: { defaultValue: 'alice@example.com' }
					},
					validateOn: ['blur'],
					revalidateOn: ['submit', 'change']
				});

				// Act
				form.fields.name.blur();
				await waitForQueuedValidation();

				// Assert
				expect(form.getErrors().fields.name).toEqual([{ message: 'Required', path: undefined }]);
			});
		});

		describe('status notifications', () => {
			it('should not notify status listeners when form revalidation returns the same status', async () => {
				// Prepare
				const form = createForm<TUserFormData>({
					fields: {
						name: { defaultValue: 'Alice' },
						email: { defaultValue: 'alice@example.com' }
					},
					validator: createStandardSchema<TUserFormData>((value) => ({ value }))
				});
				await form.submit();
				let statusChangeCount = 0;
				form.status.listen(() => {
					statusChangeCount++;
				});

				// Act
				form.fields.name.set('Bob');
				await waitForQueuedValidation();

				// Assert
				expect(form.status.get()).toEqual({ type: 'valid' });
				expect(statusChangeCount).toBe(0);
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
						validator: createRequiredStringSchema()
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

interface TPasswordFormData {
	password: string;
	confirm: string;
}

function createRequiredStringSchema(message = 'Required'): StandardSchemaV1<string> {
	return createStandardSchema<string>((value) =>
		value.length > 0 ? { value } : { issues: [{ message }] }
	);
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
