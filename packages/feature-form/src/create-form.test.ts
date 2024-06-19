import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import * as yup from 'yup';
import * as zod from 'zod';

import { createForm, fromValidator } from './create-form';
import { createValidator, valibotValidator, yupValidator, zodValidator } from './form-field';

describe('createForm function', () => {
	it('shoudl work', async () => {
		const form = createForm({
			fields: {
				item1: fromValidator(yupValidator(yup.number().required().positive().integer()), {
					defaultValue: 10
				}),
				item2: fromValidator(zodValidator(zod.string().email()), {
					defaultValue: 'test@gmail.com'
				}),
				item3: fromValidator(
					yupValidator(
						yup.object({
							nested: yup.string().required()
						})
					),
					{ defaultValue: { nested: 'object' } }
				),
				item4: fromValidator(
					valibotValidator(
						v.object({
							name: v.string(),
							url: v.pipe(v.string(), v.url())
						})
					),

					{
						defaultValue: {
							name: 'Jeff',
							url: 'jeffcom'
						}
					}
				),
				item5: fromValidator<number>(
					createValidator([
						{
							key: 'date',
							validate: (formField) => {
								if (formField._value != null) {
									const date = new Date(formField._value);
								}
							}
						}
					]),
					{
						defaultValue: Date.now()
					}
				)
			}
		});

		await form.validate();

		expect(form).not.toBeNull();
	});
});
