import * as v from 'valibot';
import { createValidationContext } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { isStandardSchema, sValidator } from './index';

describe('sValidator function', () => {
	it('should validate valid strings', async () => {
		const schema = z.string().min(3);
		const validator = sValidator(schema);
		const context = createValidationContext<string>('hello');

		await validator.validate(context);

		expect(context.hasError()).toBe(false);
		expect(context.value).toBe('hello');
	});

	it('should reject invalid values', async () => {
		const schema = z.string().min(3);
		const validator = sValidator(schema);
		const context = createValidationContext<string>('hi');

		await validator.validate(context);

		expect(context.hasError()).toBe(true);
		expect(context.errors[0]?.code).toBe('validation_error');
	});

	it('should validate complex schemas', async () => {
		const schema = v.object({
			name: v.string(),
			age: v.pipe(v.number(), v.minValue(18))
		});
		const validator = sValidator(schema);
		const context = createValidationContext<{ name: string; age: number }>({
			name: 'John',
			age: 25
		});

		await validator.validate(context);

		expect(context.hasError()).toBe(false);
		expect(context.value).toEqual({ name: 'John', age: 25 });
	});

	it('should handle validation errors correctly', async () => {
		const schema = v.object({
			name: v.string(),
			age: v.pipe(v.number(), v.minValue(18))
		});
		const validator = sValidator(schema);
		const context = createValidationContext<{ name: string; age: number }>({
			name: 'John',
			age: 15
		});

		await validator.validate(context);

		expect(context.hasError()).toBe(true);
		expect(context.errors[0]?.code).toBe('validation_error');
		expect(context.errors[0]?.message).toBeDefined();
	});

	it('should support validator methods', async () => {
		const schema = z.string();
		const validator = sValidator(schema);
		const clonedValidator = validator.clone();

		expect(clonedValidator).not.toBe(validator);
		expect(clonedValidator._validationChain[0]?.key).toBe('standard-schema');
	});
});

describe('isStandardSchema function', () => {
	it('should identify valid Standard Schema objects', () => {
		expect(isStandardSchema(z.string())).toBe(true);
		expect(isStandardSchema(v.string())).toBe(true);
	});

	it('should reject invalid objects', () => {
		expect(isStandardSchema(null)).toBe(false);
		expect(isStandardSchema({})).toBe(false);
		expect(isStandardSchema({ '~standard': {} })).toBe(false);
	});
});
