import { createForm, type TFormField, type TValidationStatusValue } from 'feature-form';
import { describe, expectTypeOf, it } from 'vitest';
import { useFormField } from './use-form-field';

describe('useFormField function', () => {
	it('should infer field value and status types', () => {
		const form = createForm<TTestFormData>({
			fields: {
				age: { defaultValue: 32 },
				name: { defaultValue: 'Jeff' },
				scope: { defaultValue: 'blockTargets' }
			}
		});
		const name = useFormField(form, 'name');
		const age = useFormField(form, 'age');

		expectTypeOf(name.field).toEqualTypeOf<TFormField<string>>();
		expectTypeOf(name.value).toEqualTypeOf<string>();
		expectTypeOf(name.status).toEqualTypeOf<TValidationStatusValue>();
		expectTypeOf(age.field).toEqualTypeOf<TFormField<number>>();
		expectTypeOf(age.value).toEqualTypeOf<number>();
	});

	it('should infer input props and require parsing for non-string fields', () => {
		const form = createForm<TTestFormData>({
			fields: {
				age: { defaultValue: 32 },
				name: { defaultValue: 'Jeff' },
				scope: { defaultValue: 'blockTargets' }
			}
		});
		const name = useFormField(form, 'name');
		const age = useFormField(form, 'age');
		const scope = useFormField(form, 'scope');

		expectTypeOf(name.input().name).toEqualTypeOf<'name'>();

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
