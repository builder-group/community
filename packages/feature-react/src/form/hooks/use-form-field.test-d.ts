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
		const age = useFormField(form, 'age', {
			format: (value) => String(value),
			parse: (value) => Number(value)
		});

		expectTypeOf(name.field).toEqualTypeOf<TFormField<string>>();
		expectTypeOf(name.status).toEqualTypeOf<TValidationStatusValue>();
		expectTypeOf(name.input().name).toEqualTypeOf<'name'>();
		expectTypeOf(age.field).toEqualTypeOf<TFormField<number>>();
		expectTypeOf(age.input().name).toEqualTypeOf<'age'>();

		// @ts-expect-error uncontrolled fields do not expose value
		name.value;
	});

	it('should expose field value in controlled mode', () => {
		const name = useFormField(form, 'name', { controlled: true });
		const age = useFormField(form, 'age', {
			controlled: true,
			format: (value) => String(value),
			parse: (value) => Number(value)
		});

		expectTypeOf(name.value).toEqualTypeOf<string>();
		expectTypeOf(age.value).toEqualTypeOf<number>();

		// @ts-expect-error input options are configured at hook level
		name.input({ controlled: true });
	});

	it('should require parse and format for non-string and union fields', () => {
		// @ts-expect-error non-string fields need parse and format
		useFormField(form, 'age');

		// @ts-expect-error controlled non-string fields need parse and format
		useFormField(form, 'age', { controlled: true });

		// @ts-expect-error string union fields need parse and format
		useFormField(form, 'scope');

		const scope = useFormField(form, 'scope', {
			format: (value) => value,
			parse: (value) => (value === 'wholeDevice' ? 'wholeDevice' : 'blockTargets')
		});
		expectTypeOf(scope.input().name).toEqualTypeOf<'scope'>();
	});
});

interface TTestFormData {
	age: number;
	name: string;
	scope: 'blockTargets' | 'wholeDevice';
}
