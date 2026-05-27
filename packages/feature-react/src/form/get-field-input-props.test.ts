import { createFormField } from 'feature-form';
import { describe, expect, it } from 'vitest';
import { getFieldInputProps } from './get-field-input-props';

describe('getFieldInputProps function', () => {
	describe('value props', () => {
		it('should return defaultValue for uncontrolled inputs', () => {
			// Prepare
			const field = createFormField('Jeff', { key: 'name' });

			// Act
			const props = getFieldInputProps<'name'>(field);

			// Assert
			expect(props.name).toBe('name');
			expect(props.defaultValue).toBe('Jeff');
			expect('value' in props).toBe(false);
		});

		it('should return value for controlled inputs', () => {
			// Prepare
			const field = createFormField('Jeff', { key: 'name' });

			// Act
			const props = getFieldInputProps<'name'>(field, { controlled: true });

			// Assert
			expect(props.name).toBe('name');
			expect(props.value).toBe('Jeff');
			expect('defaultValue' in props).toBe(false);
		});

		it('should format non-string field values', () => {
			// Prepare
			const field = createFormField(32, { key: 'age' });

			// Act
			const props = getFieldInputProps<'age', number>(field, {
				format: (value) => String(value),
				parse: (value) => Number(value)
			});

			// Assert
			expect(props.defaultValue).toBe('32');
		});
	});

	describe('onChange handler', () => {
		it('should update uncontrolled fields in the background', () => {
			// Prepare
			const field = createFormField('Jeff', { key: 'name' });
			const changes: unknown[] = [];
			field.listen((change) => {
				changes.push(change);
			});
			const props = getFieldInputProps<'name'>(field);

			// Act
			props.onChange(createInputChangeEvent('Ben'));

			// Assert
			expect(field.get()).toBe('Ben');
			expect(changes).toEqual([
				expect.objectContaining({
					background: true,
					prevValue: 'Jeff',
					value: 'Ben'
				})
			]);
		});

		it('should parse and update controlled fields outside the background', () => {
			// Prepare
			const field = createFormField(32, { key: 'age' });
			const changes: unknown[] = [];
			field.listen((change) => {
				changes.push(change);
			});
			const props = getFieldInputProps<'age', number>(field, {
				controlled: true,
				format: (value) => String(value),
				parse: (value) => Number(value)
			});

			// Act
			props.onChange(createInputChangeEvent('42'));

			// Assert
			expect(field.get()).toBe(42);
			expect(changes).toEqual([
				expect.objectContaining({
					background: false,
					prevValue: 32,
					value: 42
				})
			]);
		});
	});

	describe('onBlur handler', () => {
		it('should blur the field', () => {
			// Prepare
			const field = createFormField('', { key: 'name' });
			const wasTouchedValues: boolean[] = [];
			field.onBlur(({ wasTouched }) => {
				wasTouchedValues.push(wasTouched);
			});
			const props = getFieldInputProps(field);

			// Act
			props.onBlur({} as Parameters<typeof props.onBlur>[0]);

			// Assert
			expect(field.isTouched.get()).toBe(true);
			expect(wasTouchedValues).toEqual([false]);
		});
	});
});

function createInputChangeEvent(value: string): TInputChangeEvent {
	return {
		currentTarget: {
			value
		}
	} as TInputChangeEvent;
}

type TInputChangeEvent = Parameters<ReturnType<typeof getFieldInputProps>['onChange']>[0];
