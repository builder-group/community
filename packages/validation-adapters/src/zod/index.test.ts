import { createValidationContext } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { zValidator } from './index';

describe('zValidator function', () => {
	it('should validate valid strings', async () => {
		const schema = z.string();
		const validator = zValidator(schema);
		const context = createValidationContext<string>('test');

		await validator.validate(context);

		expect(context.hasError()).toBe(false);
		expect(context.value).toBe('test');
	});

	it('should reject invalid values', async () => {
		const schema = z.string();
		const validator = zValidator(schema);
		const context = createValidationContext<string>(123 as any);

		await validator.validate(context);

		expect(context.hasError()).toBe(true);
		expect(context.errors[0]?.code).toBe('invalid_type');
	});

	it('should validate complex schemas', async () => {
		const schema = z.object({
			name: z.string(),
			age: z.number()
		});
		const validator = zValidator(schema);
		const context = createValidationContext<{ name: string; age: number }>({
			name: 'John',
			age: 30
		});

		await validator.validate(context);

		expect(context.hasError()).toBe(false);
		expect(context.value).toEqual({ name: 'John', age: 30 });
	});

	it('should handle validation errors correctly', async () => {
		const schema = z.string().min(5);
		const validator = zValidator(schema);
		const context = createValidationContext<string>('hi');

		await validator.validate(context);

		expect(context.hasError()).toBe(true);
		expect(context.errors[0]?.code).toBe('too_small');
		expect(context.errors[0]?.message).toBeDefined();
	});

	it('should support validator methods', async () => {
		const schema = z.string();
		const validator = zValidator(schema);
		const clonedValidator = validator.clone();

		expect(clonedValidator).not.toBe(validator);
		expect(clonedValidator._validationChain[0]?.key).toBe('zod');
	});
});
