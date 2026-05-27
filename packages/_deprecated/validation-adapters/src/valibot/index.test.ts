import * as v from 'valibot';
import { createValidationContext } from 'validation-adapter';
import { describe, expect, it } from 'vitest';
import { vValidator } from './index';

describe('vValidator function', () => {
	it('should validate valid strings', async () => {
		const schema = v.string();
		const validator = vValidator(schema);
		const context = createValidationContext<string>('test');

		await validator.validate(context);

		expect(context.hasError()).toBe(false);
		expect(context.value).toBe('test');
	});

	it('should reject invalid values', async () => {
		const schema = v.string();
		const validator = vValidator(schema);
		const context = createValidationContext<string>(123 as any);

		await validator.validate(context);

		expect(context.hasError()).toBe(true);
		expect(context.errors[0]?.code).toBe('string');
	});

	it('should validate complex schemas', async () => {
		const schema = v.object({
			name: v.string(),
			age: v.number()
		});
		const validator = vValidator(schema);
		const context = createValidationContext<{ name: string; age: number }>({
			name: 'John',
			age: 30
		});

		await validator.validate(context);

		expect(context.hasError()).toBe(false);
		expect(context.value).toEqual({ name: 'John', age: 30 });
	});

	it('should handle validation errors correctly', async () => {
		const schema = v.pipe(v.string(), v.minLength(5));
		const validator = vValidator(schema);
		const context = createValidationContext<string>('hi');

		await validator.validate(context);

		expect(context.hasError()).toBe(true);
		expect(context.errors[0]?.code).toBe('min_length');
		expect(context.errors[0]?.message).toBeDefined();
	});

	it('should support validator methods', async () => {
		const schema = v.string();
		const validator = vValidator(schema);
		const clonedValidator = validator.clone();

		expect(clonedValidator).not.toBe(validator);
		expect(clonedValidator._validationChain[0]?.key).toBe('valibot');
	});
});
