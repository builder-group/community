import { object, string } from 'valibot';
import { describe, expect, it } from 'vitest';
import * as yup from 'yup';
import * as zod from 'zod';

import { createForm } from './create-form';
import { createYupFormFieldValidator, createZodFormFieldValidator } from './form-field';

describe('createForm function', () => {
	it('shoudl work', () => {
		const Schema = object({
			name: string(),
			url: string()
		});

		const form = createForm({
			fields: {
				item1: {
					initalValue: 10,
					validator: createYupFormFieldValidator(yup.number().required().positive().integer())
				},
				item2: {
					initalValue: 'hello@gmail.com',
					validator: createZodFormFieldValidator(zod.string().email())
				},
				item3: {
					initalValue: { nested: 'object' },
					validator: createYupFormFieldValidator(
						yup.object({
							nested: yup.string().required()
						})
					)
				}
			}
		});

		const item3 = form.getField('item3');

		expect(form).not.toBeNull();
	});
});
