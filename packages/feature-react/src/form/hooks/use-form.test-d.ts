import {
	createForm,
	dirtyFeature,
	type TFormField,
	type TValidationStatusValue
} from 'feature-form';
import { describe, expectTypeOf, it } from 'vitest';
import { useForm } from './use-form';

describe('useForm function', () => {
	it('should infer field, status, and input types from form data', () => {
		const form = createForm<TTestFormData>({
			fields: {
				age: { defaultValue: 32 },
				name: { defaultValue: 'Jeff' },
				nickname: { defaultValue: undefined },
				scope: { defaultValue: 'blockTargets' }
			}
		});
		const response = useForm(form);

		expectTypeOf(response.form).toEqualTypeOf(form);
		expectTypeOf(response.field('name')).toEqualTypeOf<TFormField<string>>();
		expectTypeOf(response.field('age')).toEqualTypeOf<TFormField<number>>();
		expectTypeOf(response.status('name').get()).toEqualTypeOf<TValidationStatusValue>();
		expectTypeOf(response.input('name').name).toEqualTypeOf<'name'>();
		expectTypeOf(response.input('nickname').name).toEqualTypeOf<'nickname'>();
	});

	it('should require parse and format for non-string and union fields', () => {
		const form = createForm<TTestFormData>({
			fields: {
				age: { defaultValue: 32 },
				name: { defaultValue: 'Jeff' },
				nickname: { defaultValue: undefined },
				scope: { defaultValue: 'blockTargets' }
			}
		});
		const response = useForm(form);

		// @ts-expect-error non-string fields need parse and format
		response.input('age');
		response.input('age', {
			format: (value) => String(value),
			parse: (value) => Number(value)
		});

		// @ts-expect-error string union fields need parse and format
		response.input('scope');
		response.input('scope', {
			format: (value) => value,
			parse: (value) => (value === 'wholeDevice' ? 'wholeDevice' : 'blockTargets')
		});
	});

	it('should infer form data in submit callbacks', () => {
		const form = createForm({
			fields: {
				name: { defaultValue: 'Jeff' }
			}
		});
		const response = useForm(form);

		response.handleSubmit({
			context: { source: 'test' },
			onValidSubmit(data, context) {
				expectTypeOf(data).toEqualTypeOf<Readonly<{ name: string }>>();
				expectTypeOf(context?.event).toEqualTypeOf<unknown>();
			}
		});
	});

	it('should preserve installed form features', () => {
		const form = createForm({
			fields: {
				name: { defaultValue: 'Jeff' }
			}
		}).with(dirtyFeature<{ name: string }>());
		const response = useForm(form);

		expectTypeOf(response.form.isDirty.get()).toEqualTypeOf<boolean>();
		expectTypeOf(response.form.dirtyFields.get()).toEqualTypeOf<{ name: boolean }>();
	});
});

interface TTestFormData {
	age: number;
	name: string;
	nickname: string | undefined;
	scope: 'blockTargets' | 'wholeDevice';
}
