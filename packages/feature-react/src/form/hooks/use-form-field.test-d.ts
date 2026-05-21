import { createForm, type TFormField, type TValidationStatusValue } from 'feature-form';
import { describe, expectTypeOf, it } from 'vitest';
import { useFormField } from './use-form-field';

const form = createForm<TTestFormData>({
	fields: {
		age: { defaultValue: 32 },
		name: { defaultValue: 'Jeff' },
		scope: { defaultValue: 'blockTargets' }
	}
});

describe('useFormField function', () => {
	it('should infer field, status, and input types', () => {
		const name = useFormField(form, 'name');
		const age = useFormField(form, 'age');

		expectTypeOf(name.field).toEqualTypeOf<TFormField<string>>();
		expectTypeOf(name.status).toEqualTypeOf<TValidationStatusValue>();
		expectTypeOf(name.input().name).toEqualTypeOf<'name'>();
		expectTypeOf(age.field).toEqualTypeOf<TFormField<number>>();
		expectTypeOf(
			age.input({
				format: (value) => String(value),
				parse: (value) => Number(value)
			}).name
		).toEqualTypeOf<'age'>();

		// @ts-expect-error uncontrolled fields do not expose value
		name.value;
	});

	it('should expose field value in controlled mode', () => {
		const name = useFormField(form, 'name', { controlled: true });
		const age = useFormField(form, 'age', { controlled: true });

		expectTypeOf(name.value).toEqualTypeOf<string>();
		expectTypeOf(age.value).toEqualTypeOf<number>();

		// @ts-expect-error input options are configured at hook level
		name.input({ controlled: true });
	});

	it('should require parse and format for non-string and union fields', () => {
		const age = useFormField(form, 'age');
		const scope = useFormField(form, 'scope');

		// @ts-expect-error non-string fields need parse and format
		age.input();

		age.input({
			format: (value) => String(value),
			parse: (value) => Number(value)
		});

		// @ts-expect-error string union fields need parse and format
		scope.input();

		scope.input({
			format: (value) => value,
			parse: (value) => (value === 'wholeDevice' ? 'wholeDevice' : 'blockTargets')
		});
	});
});

interface TTestFormData {
	age: number;
	name: string;
	scope: 'blockTargets' | 'wholeDevice';
}
