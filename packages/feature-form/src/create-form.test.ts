import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import * as yup from 'yup';
import * as zod from 'zod';

import { createForm } from './create-form';
import {
	createValibotFormFieldValidator,
	createYupFormFieldValidator,
	createZodFormFieldValidator
} from './form-field';

describe('createForm function', () => {
	it('shoudl work', async () => {
		const form = createForm({
			fields: {
				item1: {
					initialValue: 10,
					validator: createYupFormFieldValidator(yup.number().required().positive().integer())
				},
				item2: {
					initialValue: 'test@gmail.com',
					validator: createZodFormFieldValidator(zod.string().email())
				},
				item3: {
					initialValue: { nested: 'object' },
					validator: createYupFormFieldValidator(
						yup.object({
							nested: yup.string().required()
						})
					)
				},
				item4: {
					initialValue: {
						name: 'Jeff',
						url: 'jeff.com'
					},
					validator: createValibotFormFieldValidator(
						v.object({
							name: v.string(),
							url: v.string()
						})
					)
				}
			}
		});

		await form.validate();

		expect(form).not.toBeNull();
	});
});
