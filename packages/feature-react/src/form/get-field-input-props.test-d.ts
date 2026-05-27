import { createFormField } from 'feature-form';
import { describe, expectTypeOf, it } from 'vitest';
import { getFieldInputProps } from './get-field-input-props';

describe('getFieldInputProps function', () => {
	it('should infer uncontrolled field props from a string form field', () => {
		const field = createFormField('Jeff', { key: 'name' });
		const props = getFieldInputProps<'name'>(field);

		expectTypeOf(props.name).toEqualTypeOf<'name'>();
		expectTypeOf(props.defaultValue).toEqualTypeOf<string | undefined>();
		expectTypeOf(props.value).toEqualTypeOf<string | undefined>();
	});

	it('should infer controlled field props from a string form field', () => {
		const field = createFormField('', { key: 'email' });
		const props = getFieldInputProps<'email'>(field, { controlled: true });

		expectTypeOf(props.name).toEqualTypeOf<'email'>();
		expectTypeOf(props.value).toEqualTypeOf<string | undefined>();
	});

	it('should accept optional string form fields without parse and format', () => {
		const field = createFormField<string | undefined>(undefined, { key: 'name' });
		const props = getFieldInputProps<'name', string | undefined>(field);

		expectTypeOf(props.defaultValue).toEqualTypeOf<string | undefined>();
	});

	it('should require parse and format for non-string fields', () => {
		const field = createFormField(32, { key: 'age' });

		// @ts-expect-error non-string fields need parse and format
		getFieldInputProps(field);

		getFieldInputProps<'age', number>(field, {
			format: (value) => String(value),
			parse: (value) => Number(value)
		});
	});

	it('should require parse and format for string union fields', () => {
		const field = createFormField<'blockTargets' | 'wholeDevice'>('blockTargets', {
			key: 'scope'
		});

		// @ts-expect-error string union fields need parse and format
		getFieldInputProps(field);

		getFieldInputProps<'scope', 'blockTargets' | 'wholeDevice'>(field, {
			format: (value) => value,
			parse: (value) => (value === 'wholeDevice' ? 'wholeDevice' : 'blockTargets')
		});
	});

	it('should require parse and format for unknown fields', () => {
		const field = createFormField<unknown>('Jeff', { key: 'name' });

		// @ts-expect-error unknown fields need parse and format
		getFieldInputProps(field);

		getFieldInputProps<'name', unknown>(field, {
			format: (value) => (typeof value === 'string' ? value : ''),
			parse: (value) => value
		});
	});
});
